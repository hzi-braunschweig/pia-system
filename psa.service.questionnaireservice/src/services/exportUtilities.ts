/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AnswerType } from '../models/answerOption';
import * as normalize from 'normalize-diacritics';
import path from 'path';

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
    const normalizedName = this.normalizeDiacritics(questionnaireName);
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
   * @param value
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
}
