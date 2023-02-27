/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { CsvService } from '../../services/csvService';
import { DateFormat, ExportUtilities } from '../../services/exportUtilities';
import { getRepository } from 'typeorm';
import { Questionnaire } from '../../entities/questionnaire';
import { QuestionnaireSettingsTransform } from '../../services/csvTransformStreams/questionnaireSettingsTransform';

export class QuestionnaireSettingsExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    let questionnaireWhere = '';

    if (this.options.questionnaires) {
      questionnaireWhere = this.options.questionnaires
        .map((q) => `(${+q.id},${+q.version})`)
        .join(',');
      questionnaireWhere = `(q1.id, q1.version) IN (${questionnaireWhere})`;
    }

    const questionnaireStream = await getRepository(Questionnaire)
      .createQueryBuilder('q1')
      .select([
        'q1.id as id',
        'q1.version as version',
        'q1.study_id as study_id',
        'q1.name as name',
        'q1.no_questions',
        'q1.cycle_amount',
        'q1.cycle_unit',
        'q1.activate_after_days',
        'q1.deactivate_after_days',
        'q1.notification_tries',
        'q1.notification_title',
        'q1.notification_body_new',
        'q1.notification_body_in_progress',
        'q1.notification_weekday',
        'q1.notification_interval',
        'q1.notification_interval_unit',
        'q1.activate_at_date',
        'q1.compliance_needed',
        'q1.expires_after_days',
        'q1.finalises_after_days',
        'q1.created_at as version_start',
        'qNextVersion.created_at as version_end',
        'q1.updated_at',
        'q1.type as type',
        'q1.publish as publish',
        'q1.notify_when_not_filled',
        'q1.notify_when_not_filled_time',
        'q1.notify_when_not_filled_day',
        'q1.cycle_per_day',
        'q1.cycle_first_hour',
        'q1.keep_answers',
        'q1.active as active',
        'c.condition_type',
        'c.condition_target_questionnaire',
        'c.condition_target_questionnaire_version',
        'qc.name as condition_target_questionnaire_name',
        'c.condition_operand',
        'c.condition_value',
        'c.condition_answer_option_id',
        'c.condition_question_id',
        'c.condition_link',
        'answer_option_target_answer_option.id as condition_target_answeroption_id',
        'answer_option_target_answer_option.position as condition_target_answeroption_position',
        'answer_option_target_answer_option.variable_name as condition_target_answeroption_variable_name',
        'answer_option_target_question.id as condition_target_answeroption_question_id',
        'answer_option_target_question.position as condition_target_answeroption_question_position',
        'answer_option_target_question.variable_name as condition_target_answeroption_question_variable_name',
      ])
      .where(`q1.study_id = :studyId AND ${questionnaireWhere}`, {
        studyId: this.options.study_name,
      })
      .leftJoin(
        'questionnaires',
        'qNextVersion',
        'q1.id = qNextVersion.id AND q1.version = qNextVersion.version - 1'
      )
      .leftJoin('q1.condition', 'c')
      .leftJoin(
        'questionnaires',
        'qc',
        'c.condition_target_questionnaire = qc.id AND c.condition_target_questionnaire_version = qc.version'
      )
      .leftJoin(
        'answer_options',
        'answer_option_target_answer_option',
        'answer_option_target_answer_option.id = c.condition_target_answer_option'
      )
      .leftJoin(
        'questions',
        'answer_option_target_question',
        'answer_option_target_question.id = answer_option_target_answer_option.question_id'
      )
      .orderBy('q1.id, q1.version')
      .stream();

    const transformStream = new QuestionnaireSettingsTransform();
    const csvStream = CsvService.stringify();

    const date = ExportUtilities.formatDate(new Date(), DateFormat.InFilename);
    this.archive.append(
      questionnaireStream.pipe(transformStream).pipe(csvStream),
      {
        name: `questionnaire_settings_${this.options.study_name}_${date}.csv`,
      }
    );
  }
}
