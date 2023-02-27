/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Transform, TransformCallback } from 'stream';
import CsvSanatizer from '../csvSanatizer';
import { config } from '../../config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore it should not be a problem if it circularly references itself since TS 3.7
type CsvRecord = CsvRecord[] | Record<string, CsvRecord> | string | null;

/**
 * A transform stream which receives an object and pushes a transformed object.
 */
export abstract class CsvTransform<T, U extends CsvRecord> extends Transform {
  protected readonly dateTimeFormat = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: config.timeZone,
  });
  protected readonly dateFormat = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: config.timeZone,
  });

  public constructor() {
    super({
      writableObjectMode: true,
      readableObjectMode: true,
    });
  }

  public _transform(
    chunk: T,
    _encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    Promise.resolve(this.convertToCsvRow(chunk))
      .then((csvRow) => {
        const result = this.preventCsvInjection(csvRow);

        if (Array.isArray(result)) {
          this._pushMultiple(result);
        } else {
          if (result) {
            this.push(result);
          }
        }
        callback();
      })
      .catch((err) => console.error(err));
  }

  /**
   * Formats a valid Date instance into a date-time string
   * @param date {Date} the date to be formatted
   * @return {string} the formated date time string
   */
  protected formatDate(date: Date | null): string {
    if (date instanceof Date) {
      return this.dateTimeFormat.format(date);
    } else {
      return '.';
    }
  }

  /**
   * Push multiple rows while ignoring whether push() signaled that no more
   * chunks should be pushed. Backpressure will be handled by NodeJS itself
   * in case of Transform streams.
   *
   * @see https://github.com/nodejs/help/issues/1791#issuecomment-759622422
   */
  private _pushMultiple(rows: CsvRecord[]): void {
    rows.forEach((row) => this.push(row));
  }

  /**
   * It removes all malicious characters in a string or every value of an object or array
   * @param valueRecord {unknown}
   */
  private preventCsvInjection(valueRecord: CsvRecord): unknown {
    // type should be CsvRecord, but ESLint can't handle it
    if (Array.isArray(valueRecord)) {
      return valueRecord.map((value) => this.preventCsvInjection(value));
    } else if (typeof valueRecord === 'object' && valueRecord !== null) {
      return Object.fromEntries(
        Object.entries(valueRecord as Record<string, unknown>).map(
          ([key, value]) => [key, this.preventCsvInjection(value)]
        )
      );
    } else if (typeof valueRecord === 'string') {
      return CsvSanatizer.removeMaliciousChars(valueRecord);
    } else {
      return valueRecord;
    }
  }

  protected abstract convertToCsvRow(
    chunk: T
  ): U | U[] | undefined | Promise<U | U[] | undefined>;
}
