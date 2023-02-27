/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CsvQuestionnaireRow } from '../../models/csvExportRows';
import {
  ColumnNameAnswerOption,
  DateFormat,
  ExportUtilities,
} from '../exportUtilities';
import { CsvTransform } from './csvTransform';
import { DbQuestionnaireSettings } from '../../models/questionnaireSettings';

export class QuestionnaireSettingsTransform extends CsvTransform<
  DbQuestionnaireSettings,
  CsvQuestionnaireRow
> {
  protected convertToCsvRow(
    questionnaire: DbQuestionnaireSettings
  ): CsvQuestionnaireRow {
    return {
      questionnaire_name: questionnaire.name,
      questionnaire_id: questionnaire.id,
      questionnaire_version: questionnaire.version,
      questionnaire_version_start: ExportUtilities.formatDateString(
        questionnaire.version_start,
        DateFormat.ISO
      ),
      questionnaire_version_end: questionnaire.version_end
        ? ExportUtilities.formatDateString(
            questionnaire.version_end,
            DateFormat.ISO
          )
        : null,
      questionnaire_type: questionnaire.type,
      cycle_unit: questionnaire.cycle_unit,
      cycle_amount: questionnaire.cycle_amount,
      cycle_per_day: questionnaire.cycle_per_day,
      cycle_first_at: questionnaire.cycle_first_hour,
      activate_at_date: questionnaire.activate_at_date
        ? ExportUtilities.formatDateString(
            questionnaire.activate_at_date,
            DateFormat.ISO
          )
        : null,
      activate_after_days: questionnaire.activate_after_days,
      deactivate_after_days: questionnaire.deactivate_after_days,
      expires_after_days: questionnaire.expires_after_days,
      non_modifiable_after_days: questionnaire.finalises_after_days,
      notification_tries: questionnaire.notification_tries,
      notification_title: questionnaire.notification_title,
      notification_body_new: questionnaire.notification_body_new,
      notification_body_in_progress:
        questionnaire.notification_body_in_progress,
      compliance_samples_needed: ExportUtilities.mapBoolean(
        Boolean(questionnaire.compliance_needed)
      ),
      visibility: questionnaire.publish,
      despite_end_signal: ExportUtilities.mapBoolean(
        Boolean(questionnaire.keep_answers)
      ),
      deactivated: ExportUtilities.mapBoolean(!questionnaire.active),
      deactivated_at:
        questionnaire.active || !questionnaire.updated_at
          ? null
          : ExportUtilities.formatDateString(
              questionnaire.updated_at,
              DateFormat.ISO
            ),
      condition_questionnaire: ExportUtilities.mapBoolean(
        Boolean(questionnaire.condition_target_questionnaire)
      ),
      condition_questionnaire_name:
        questionnaire.condition_target_questionnaire_name,
      condition_questionnaire_id:
        questionnaire.condition_target_questionnaire ?? null,
      condition_questionnaire_version:
        questionnaire.condition_target_questionnaire_version ?? null,
      condition_questionnaire_question_id:
        this.composeConditionQuestionId(questionnaire),
      condition_questionnaire_question_column_name:
        this.composeConditionColumnName(questionnaire),
      condition_questionnaire_question_operand:
        ExportUtilities.wrapRiskyCsvValue(questionnaire.condition_operand) ??
        null,
      condition_questionnaire_question_answer_value:
        questionnaire.condition_value ?? null,
      condition_questionnaire_question_link:
        questionnaire.condition_link ?? null,
    };
  }

  private composeConditionQuestionId(
    row: DbQuestionnaireSettings
  ): string | null {
    if (
      row.condition_target_answeroption_question_id &&
      row.condition_target_answeroption_id
    ) {
      return `q${row.condition_target_answeroption_question_id}_${row.condition_target_answeroption_id}`;
    } else {
      return null;
    }
  }

  private composeConditionColumnName(
    row: DbQuestionnaireSettings
  ): string | null {
    let answerOptions: ColumnNameAnswerOption;
    if (
      row.condition_type &&
      row.condition_target_answeroption_question_position &&
      row.condition_target_answeroption_position &&
      row.condition_target_questionnaire_name &&
      row.condition_target_questionnaire &&
      row.condition_target_questionnaire_version
    ) {
      answerOptions = {
        questionPosition: row.condition_target_answeroption_question_position,
        questionVariableName:
          row.condition_target_answeroption_question_variable_name,
        answerOptionPosition: row.condition_target_answeroption_position,
        questionnaireName: row.condition_target_questionnaire_name,
        questionnaireId: row.condition_target_questionnaire,
        questionnaireVersion: row.condition_target_questionnaire_version,
        answerOptionVariableName:
          row.condition_target_answeroption_variable_name,
      };
    } else {
      return null;
    }

    return ExportUtilities.composeColumnNameAnswerOption(answerOptions);
  }
}
