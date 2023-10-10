/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerType } from '../models/answerOption';
import * as normalize from 'normalize-diacritics';
import path from 'path';
import formatInTimeZone from 'date-fns-tz/formatInTimeZone';
import { ExportBoolean } from '../models/csvExportRows';
import { format } from 'date-fns-tz';

export interface AnswerPosition {
  questionPosition?: number;
  answerOptionPosition?: number;
  answerValuePosition?: number;
}

export interface ColumnNameQuestion {
  questionnaireId: number;
  questionnaireName: string;
  questionnaireVersion: number;
  questionPosition: number;
  questionVariableName: string | null;
}

export interface ColumnNameAnswerOption extends ColumnNameQuestion {
  answerOptionVariableName: string | null;
  answerOptionPosition: number;
}

export interface ColumnNameAnswerValue extends ColumnNameAnswerOption {
  answerType: AnswerType;
  answerValuePosition?: number;
  answerValueText?: string;
  answerValueSampleId?: number;
}

export enum DateFormat {
  Date = 'yyyy-MM-dd',
  ISO = `yyyy-MM-dd'T'HH:mm:ssxxx`,
  InFilename = `yyyy-MM-dd'T'HHmm`,
}

const nameLength = 3;

export class ExportUtilities {
  public static composeQuestionSegment(
    questionnaireVersion: number,
    answerPosition: AnswerPosition
  ): string {
    return `v${questionnaireVersion}_${this.composeAnswerPosition(
      answerPosition
    )}`;
  }

  public static composePrefixColumnName(
    questionnaireId: number,
    questionnaireName: string,
    suffix: string
  ): string {
    const normalizedName = this.replaceUmlauts(questionnaireName);
    const shortenedName = normalizedName.substring(0, nameLength);

    return `${questionnaireId}_${shortenedName}_${suffix}`;
  }

  public static composeColumnNameQuestion(param: ColumnNameQuestion): string {
    let suffix = param.questionVariableName;

    if (!suffix) {
      suffix = this.composeQuestionSegment(param.questionnaireVersion, {
        questionPosition: param.questionPosition,
      });
    }

    return this.composePrefixColumnName(
      param.questionnaireId,
      param.questionnaireName,
      suffix
    );
  }

  public static composeColumnNameAnswerOption(
    param: ColumnNameAnswerOption
  ): string {
    let suffix = param.answerOptionVariableName;

    if (!suffix) {
      suffix = `${this.composeQuestionSegment(
        param.questionnaireVersion,
        param
      )}`;
    }

    return this.composePrefixColumnName(
      param.questionnaireId,
      param.questionnaireName,
      suffix
    );
  }

  public static composeColumnNameAnswerValue(
    param: ColumnNameAnswerValue
  ): string {
    if (param.answerType === AnswerType.MultiSelect && param.answerValueText) {
      return (
        this.composeColumnNameAnswerOption(param) + `_${param.answerValueText}`
      );
    } else if (
      param.answerType === AnswerType.Sample &&
      param.answerValueSampleId
    ) {
      return (
        this.composeColumnNameAnswerOption(param) +
        `_ProbenID${param.answerValueSampleId}`
      );
    }

    return this.composeColumnNameAnswerOption(param);
  }

  public static composeAnswerPosition(param: AnswerPosition): string {
    const segments: string[] = [];

    if (param.questionPosition) {
      segments.push(`q${param.questionPosition}`);
    }

    if (param.answerOptionPosition) {
      segments.push(`${param.answerOptionPosition}`);
    }

    if (param.answerValuePosition) {
      segments.push(`${param.answerValuePosition}`);
    }

    return segments.join('_');
  }

  /**
   * Remove diacritics (áūë etc.) and substitute umlauts (äöüß)
   */
  public static normalizeDiacritics(value: string): string {
    return normalize.normalizeSync(this.replaceUmlauts(value));
  }

  public static normalizeFilename(filename: string): string {
    const ext = path.extname(filename);
    let name = filename.replace(ext, '');
    name = this.normalizeDiacritics(name);
    name = name.replace(/[^A-Za-z0-9\s_-]/gm, '');
    return `${name}${ext}`;
  }

  public static replaceUmlauts(value: string): string {
    value = value.replace(/ä/g, 'ae');
    value = value.replace(/ö/g, 'oe');
    value = value.replace(/ü/g, 'ue');
    value = value.replace(/ß/g, 'ss');
    value = value.replace(/Ä/g, 'Ae');
    value = value.replace(/Ö/g, 'Oe');
    value = value.replace(/Ü/g, 'Ue');
    return value;
  }

  public static sanitizeForFilename(name: string): string {
    name = ExportUtilities.normalizeFilename(name);
    name = name.replace(/[\s_]+/g, '-');
    return name;
  }

  public static formatDateString(date: string, dateFormat: DateFormat): string {
    return formatInTimeZone(
      this.convertStringToDateObject(date),
      'UTC',
      dateFormat
    );
  }

  public static formatDate(date: Date, dateFormat: DateFormat): string {
    return formatInTimeZone(date, 'UTC', dateFormat);
  }

  public static formatDateStringWithoutTimeZone(
    dateString: string,
    dateFormat: DateFormat
  ): string {
    // dates are in the format: 'Thu Sep 14 2023 00:00:00 GMT+0200 (Central European Summer Time)'
    // the regex is used to strip the timezone because otherwise the date can change
    // depending on the timezone of the server (can be +/- 1 day)
    const regex = /^.*\d\d:\d\d:\d\d/;
    const match = regex.exec(dateString);

    if (match?.[0]) {
      const parsedDate = this.convertStringToDateObject(match[0]);
      return format(parsedDate, dateFormat);
    }

    return format(this.convertStringToDateObject(dateString), dateFormat);
  }

  /**
   * Checks if the answer type will deflate e.g. add additional rows
   */
  public static answerTypeDoesDeflate(answerType: AnswerType): boolean {
    return [
      AnswerType.SingleSelect,
      AnswerType.MultiSelect,
      AnswerType.Sample,
    ].includes(answerType);
  }

  public static convertStringToDateObject(value: string): Date {
    let date = new Date(value);

    if (!isNaN(date.getTime())) {
      return date;
    }

    date = new Date(parseInt(value, 10));

    if (!isNaN(date.getTime())) {
      return date;
    }

    throw new Error('Could not parse the date');
  }

  public static mapBoolean(bool: boolean): ExportBoolean {
    return bool ? ExportBoolean.true : ExportBoolean.false;
  }

  public static composeFileName(
    fileId: number,
    fileName: string | null | undefined
  ): string {
    const sanitizedFileName = fileName ? this.normalizeFilename(fileName) : '';
    return `${fileId}-${sanitizedFileName}`;
  }

  /**
   * Wraps a risky csv value like an operand (e.g. ==, !=) or a number (-7)
   * to prevent csv sanitation from removing it.
   *
   * @param value
   */
  public static wrapRiskyCsvValue(
    value: string | number | null
  ): string | null {
    return value ? `"${value}"` : null;
  }
}
