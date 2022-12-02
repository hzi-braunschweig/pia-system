/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable security/detect-object-injection */

import { CsvTransform } from './csvTransform';
import { CodebookBoolean, CodebookDbRow } from '../../models/codebook';
import { AnswerType } from '../../models/answerOption';
import { ConditionType } from '../../models/condition';
import { ColumnNameAnswerOption, ExportUtilities } from '../exportUtilities';
import { CsvCodebookRow } from '../../models/csvExportRows';
import removeMarkdown from 'remove-markdown';

interface Parameter {
  answerOptionText?: string;
  answerOption?: string;
  code?: number | string;
}

const answerTypeMapping = new Map<AnswerType, string>([
  [AnswerType.SingleSelect, 'single choice'],
  [AnswerType.MultiSelect, 'multiple choice'],
  [AnswerType.Number, 'numeric'],
  [AnswerType.Text, 'text'],
  [AnswerType.Date, 'date'],
  [AnswerType.Sample, 'sample'],
  [AnswerType.PZN, 'pzn'],
  [AnswerType.Image, 'image'],
  [AnswerType.Timestamp, 'timestamp'],
  [AnswerType.File, 'file'],
]);

const conditionTypeMapping = new Map<ConditionType | null, string>([
  [ConditionType.INTERNAL_THIS, 'on current questionnaire'],
  [ConditionType.INTERNAL_LAST, 'on last questionnaire instance'],
  [ConditionType.EXTERNAL, 'on external questionnaire'],
]);

const missingParam: Parameter = {
  code: '.',
  answerOption: 'missing',
};

export class CodebookTransform extends CsvTransform<
  CodebookDbRow,
  CsvCodebookRow
> {
  protected currentQuestionId: number | null = null;

  protected convertToCsvRow(
    dbRow: CodebookDbRow
  ): CsvCodebookRow | CsvCodebookRow[] {
    const rows: CsvCodebookRow[] = [];

    // Checking if the question has changed, is only possible because we know
    // at this point, that our rows are sorted
    if (this.currentQuestionId !== dbRow.question_id) {
      rows.push(this.createQuestionRow(dbRow));
      this.currentQuestionId = dbRow.question_id;
    }

    if (this.hasAnswerOptions(dbRow)) {
      if (!this.answerWillTypeDeflate(dbRow)) {
        rows.push(this.createAnswerOptionRow(dbRow));
        rows.push(this.createAnswerOptionRow(dbRow, missingParam));
      }

      switch (dbRow.answer_type_id) {
        case AnswerType.SingleSelect:
          this.addSingleSelectRows(dbRow, rows);
          break;
        case AnswerType.MultiSelect:
          this.addMultiSelectRows(dbRow, rows);
          break;
        case AnswerType.Sample:
          this.addSampleRows(dbRow, rows);
      }
    }

    return this.normalizeStringsInRows(rows);
  }

  private addMultiSelectRows(
    dbRow: CodebookDbRow,
    rows: CsvCodebookRow[]
  ): void {
    rows.push(this.createAnswerOptionRow(dbRow));
    dbRow.answeroption_values.forEach((value, index) => {
      const answerValuePosition = index + 1;

      rows.push(
        this.createAnswerValueRow(dbRow, {
          code: 1,
          answerOption: 'yes',
          answerOptionText: value,
          answerValuePosition,
        })
      );
      rows.push(
        this.createAnswerValueRow(dbRow, {
          code: 0,
          answerOption: 'no',
          answerOptionText: value,
          answerValuePosition,
        })
      );
      rows.push(
        this.createAnswerValueRow(dbRow, {
          ...missingParam,
          answerOptionText: value,
          answerValuePosition,
        })
      );
    });
  }

  private addSingleSelectRows(
    dbRow: CodebookDbRow,
    rows: CsvCodebookRow[]
  ): void {
    dbRow.answeroption_values.forEach((value, index) =>
      rows.push(
        this.createAnswerOptionRow(dbRow, {
          code: dbRow.values_code[index],
          answerOption: value,
          answerOptionText: dbRow.answeroption_text,
        })
      )
    );

    rows.push(
      this.createAnswerOptionRow(dbRow, {
        ...missingParam,
        answerOptionText: dbRow.answeroption_text,
      })
    );
  }

  private addSampleRows(dbRow: CodebookDbRow, rows: CsvCodebookRow[]): void {
    rows.push(
      this.createAnswerValueRow(dbRow, {
        textLevel2: dbRow.answeroption_text,
        answerValueSampleId: 1,
      })
    );
    rows.push(
      this.createAnswerValueRow(dbRow, {
        ...missingParam,
        textLevel2: dbRow.answeroption_text,
        answerValueSampleId: 1,
      })
    );
    rows.push(
      this.createAnswerValueRow(dbRow, {
        textLevel2: dbRow.answeroption_text,
        answerValueSampleId: 2,
      })
    );
    rows.push(
      this.createAnswerValueRow(dbRow, {
        ...missingParam,
        textLevel2: dbRow.answeroption_text,
        answerValueSampleId: 2,
      })
    );
  }

  private createQuestionRow(row: CodebookDbRow): CsvCodebookRow {
    return {
      questionnaire_id: row.questionnaire_id,
      questionnaire_version: row.questionnaire_version,
      questionnaire_name: row.questionnaire_name,
      variable_name: row.question_variable_name,
      column_name: ExportUtilities.composeColumnNameQuestion({
        questionVariableName: row.question_variable_name,
        questionPosition: row.question_position,
        questionnaireName: row.questionnaire_name,
        questionnaireVersion: row.questionnaire_version,
        questionnaireId: row.questionnaire_id,
      }),
      answer_position: ExportUtilities.composeAnswerPosition({
        questionPosition: row.question_position,
      }),
      text_level_1: row.question_text,
      text_level_2: null,
      answer_option_text: null,
      answer_type: null,
      answer_category: null,
      answer_category_code: null,
      valid_min: null,
      valid_max: null,
      answer_required: this.mapBoolean(row.is_mandatory),
      condition_question: this.mapBoolean(!!row.question_condition_type),
      condition_question_type: this.mapConditionType(
        row.question_condition_type
      ),
      condition_question_questionnaire_id:
        row.question_condition_target_questionnaire,
      condition_question_questionnaire_version:
        row.question_condition_target_questionnaire_version,
      condition_question_column_name: this.composeConditionColumnName(row),
      condition_question_operand: this.wrapRiskyCsvValue(
        row.question_condition_operand
      ),
      condition_question_answer_value: row.question_condition_value,
      condition_question_link: row.question_condition_link,
    };
  }

  private createAnswerOptionRow(
    row: CodebookDbRow,
    param?: Parameter
  ): CsvCodebookRow {
    return {
      ...this.createQuestionRow(row),
      column_name: ExportUtilities.composeColumnNameAnswerOption({
        questionVariableName: row.question_variable_name,
        questionPosition: row.question_position,
        questionnaireName: row.questionnaire_name,
        questionnaireId: row.questionnaire_id,
        questionnaireVersion: row.questionnaire_version,
        answerOptionVariableName: row.answeroption_variable_name,
        answerOptionPosition: row.answeroption_position,
      }),
      answer_position: ExportUtilities.composeAnswerPosition({
        questionPosition: row.question_position,
        answerOptionPosition: row.answeroption_position,
      }),
      variable_name: row.answeroption_variable_name,
      answer_category: param?.answerOption ?? null,
      answer_category_code: param?.code ?? null,
      text_level_1: null,
      text_level_2: row.answeroption_text,
      answer_option_text: null,
      valid_min: this.wrapRiskyCsvValue(row.restriction_min),
      valid_max: this.wrapRiskyCsvValue(row.restriction_max),
      answer_type: this.mapAnswerType(row),
      condition_question: this.mapBoolean(
        !!(row.answeroption_condition_type !== null
          ? row.answeroption_condition_type
          : row.question_condition_type)
      ),
      condition_question_type: this.mapConditionType(
        row.answeroption_condition_type ?? row.question_condition_type
      ),
      condition_question_questionnaire_id:
        row.answeroption_condition_target_questionnaire ??
        row.question_condition_target_questionnaire,
      condition_question_questionnaire_version:
        row.answeroption_condition_target_questionnaire_version ??
        row.question_condition_target_questionnaire_version,
      condition_question_column_name: this.composeConditionColumnName(row),
      condition_question_operand: this.wrapRiskyCsvValue(
        row.answeroption_condition_operand ?? row.question_condition_operand
      ),
      condition_question_answer_value:
        row.answeroption_condition_value ?? row.question_condition_value,
      condition_question_link:
        row.answeroption_condition_link ?? row.question_condition_link,
    };
  }

  private createAnswerValueRow(
    row: CodebookDbRow,
    param: Parameter & {
      textLevel2?: string;
      answerOptionText?: string;
      answerValuePosition?: number;
      answerValueSampleId?: number;
    }
  ): CsvCodebookRow {
    return {
      ...this.createAnswerOptionRow(row),
      text_level_2: param.textLevel2 ?? null,
      answer_option_text: param.answerOptionText ?? null,
      answer_category: param.answerOption ?? null,
      answer_category_code: param.code ?? null,
      column_name: ExportUtilities.composeColumnNameAnswerValue({
        questionVariableName: row.question_variable_name,
        questionPosition: row.question_position,
        questionnaireName: row.questionnaire_name,
        questionnaireId: row.questionnaire_id,
        questionnaireVersion: row.questionnaire_version,
        answerOptionVariableName: row.answeroption_variable_name,
        answerOptionPosition: row.answeroption_position,
        answerType: row.answer_type_id,
        answerValuePosition: param.answerValuePosition,
        answerValueText: param.answerOptionText,
        answerValueSampleId: param.answerValueSampleId,
      }),
      answer_position: ExportUtilities.composeAnswerPosition({
        questionPosition: row.question_position,
        answerOptionPosition: row.answeroption_position,
        answerValuePosition: param.answerValuePosition,
      }),
    };
  }

  private mapBoolean(bool: boolean): CodebookBoolean {
    return bool ? CodebookBoolean.true : CodebookBoolean.false;
  }

  private mapAnswerType(row: CodebookDbRow): string {
    let answerType: string = answerTypeMapping.get(row.answer_type_id) ?? '';

    if (row.answer_type_id === AnswerType.Number) {
      answerType += row.is_decimal ? ' float' : ' integer';
    }

    return answerType;
  }

  private mapConditionType(type: ConditionType | null): string {
    return conditionTypeMapping.get(type) ?? '';
  }

  /**
   * Checks if the answer type will deflate e.g. add additional rows
   * @param row
   */
  private answerWillTypeDeflate(row: CodebookDbRow): boolean {
    return [
      AnswerType.SingleSelect,
      AnswerType.MultiSelect,
      AnswerType.Sample,
    ].includes(row.answer_type_id);
  }

  private normalizeStringsInRows(rows: CsvCodebookRow[]): CsvCodebookRow[] {
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (key in row && typeof row[key] === 'string') {
          let value = row[key] as string;
          value = ExportUtilities.normalizeDiacritics(value);
          value = removeMarkdown(value);
          row[key] = value;
        }
      });
    });

    return rows;
  }

  private composeConditionColumnName(row: CodebookDbRow): string | null {
    let answerOptions: ColumnNameAnswerOption;

    if (
      row.answeroption_condition_type &&
      row.answeroption_condition_target_question_position &&
      row.answeroption_condition_target_answeroption_position &&
      row.answeroption_condition_target_questionnaire_name &&
      row.answeroption_condition_target_questionnaire &&
      row.answeroption_condition_target_questionnaire_version
    ) {
      answerOptions = {
        questionPosition: row.answeroption_condition_target_question_position,
        questionVariableName:
          row.answeroption_condition_target_question_variable_name,
        answerOptionPosition:
          row.answeroption_condition_target_answeroption_position,
        questionnaireName: row.answeroption_condition_target_questionnaire_name,
        questionnaireId: row.answeroption_condition_target_questionnaire,
        questionnaireVersion:
          row.answeroption_condition_target_questionnaire_version,
        answerOptionVariableName:
          row.answeroption_condition_target_answeroption_variable_name,
      };
    } else if (
      row.question_condition_type &&
      row.question_condition_target_question_position &&
      row.question_condition_target_answeroption_position &&
      row.question_condition_target_questionnaire_name &&
      row.question_condition_target_questionnaire &&
      row.question_condition_target_questionnaire_version
    ) {
      answerOptions = {
        questionPosition: row.question_condition_target_question_position,
        questionVariableName:
          row.question_condition_target_question_variable_name,
        answerOptionPosition:
          row.question_condition_target_answeroption_position,
        questionnaireName: row.question_condition_target_questionnaire_name,
        questionnaireId: row.question_condition_target_questionnaire,
        questionnaireVersion:
          row.question_condition_target_questionnaire_version,
        answerOptionVariableName:
          row.question_condition_target_answeroption_variable_name,
      };
    } else {
      return null;
    }

    return ExportUtilities.composeColumnNameAnswerOption(answerOptions);
  }

  /**
   * Wraps a risky csv value like an operand (e.g. ==, !=) or a number (-7)
   * to prevent csv sanitation from removing it.
   *
   * @param value
   */
  private wrapRiskyCsvValue(value: string | number | null): string | null {
    return value ? `"${value}"` : null;
  }

  private hasAnswerOptions(dbRow: CodebookDbRow): boolean {
    return !!dbRow.answer_type_id;
  }
}
