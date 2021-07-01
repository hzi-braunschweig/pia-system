import { Transform, TransformCallback } from 'stream';
import CsvSanatizer from '../csvSanatizer';
import { config } from '../../config';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore it should not be a problem if it circularly references itself since TS 3.7
type CsvRecord = CsvRecord[] | Record<string, CsvRecord> | string | null;

/**
 * A transform stream wich receives a object and pushes a transformed object.
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
    const result = this.preventCsvInjection(this.convertToCsvRow(chunk));
    if (result) {
      this.push(result);
    }
    callback();
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
   * It removes all malicious characters in a string or every value of an object or array
   * @param valueRecord {unknown}
   */
  private preventCsvInjection(valueRecord: CsvRecord): unknown {
    // type should be CsvRecord, but ESLint can't handle it
    if (Array.isArray(valueRecord)) {
      return valueRecord.map((value) => this.preventCsvInjection(value));
    } else if (typeof valueRecord === 'object' && valueRecord !== null) {
      return Object.fromEntries(
        Object.entries(valueRecord).map(([key, value]) => [
          key,
          this.preventCsvInjection(value),
        ])
      );
    } else if (typeof valueRecord === 'string') {
      return CsvSanatizer.removeMaliciousChars(valueRecord);
    } else {
      return valueRecord;
    }
  }

  protected abstract convertToCsvRow(chunk: T): U | undefined;
}
