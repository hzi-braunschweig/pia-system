/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AbstractExportFeature } from './abstractExportFeature';
import { CsvService } from '../../services/csvService';
import { Questionnaire } from '../../entities/questionnaire';
import { CodebookTransform } from '../../services/csvTransformStreams/codebookTransform';
import { ExportUtilities } from '../../services/exportUtilities';
import { ConditionalQuestionnaireInfo } from '../../models/questionnaireInfo';
import { promisifyStream } from '../../helpers/promisifyStream';

export class CodebookExport extends AbstractExportFeature {
  public async apply(): Promise<void> {
    let questionnaireWhere = '';

    if (this.options.questionnaires) {
      questionnaireWhere = this.options.questionnaires
        .map((q) => `(${+q.id},${+q.version})`)
        .join(',');
      questionnaireWhere =
        ' AND (q.id, q.version) IN (' + questionnaireWhere + ')';
    }

    const questionnaires = (await this.dbPool
      .getRepository(Questionnaire)
      .createQueryBuilder('q')
      .select([
        'q.id id',
        'q.name "name"',
        'q.version "version"',
        'CASE WHEN c.condition_type IS NOT NULL THEN true ELSE false END AS has_condition',
      ])
      .where(`q.study_id = :studyId${questionnaireWhere}`, {
        studyId: this.options.study_name,
      })
      .leftJoin('q.condition', 'c')
      .execute()) as ConditionalQuestionnaireInfo[];

    for (const questionnaire of questionnaires) {
      const questionnaireStream = await this.dbPool
        .getRepository(Questionnaire)
        .createQueryBuilder('questionnaire')
        .select([
          'questionnaire.id',
          'questionnaire.version',
          'questionnaire.study_id',
          'questionnaire.name',
          'question.id',
          'question.text',
          'question.help_text',
          'question.variable_name as question_variable_name',
          'question.position',
          'question.is_mandatory',
          'answerOption.text as answeroption_text',
          'answerOption.answer_type_id',
          'answerOption.position as answeroption_position',
          'answerOption.values answeroption_values',
          'answerOption.values_code',
          'answerOption.restriction_min',
          'answerOption.restriction_max',
          'answerOption.variable_name as answeroption_variable_name',
          'answerOption.is_decimal',

          'answerOptionCondition.condition_type as answeroption_condition_type',
          'answerOptionCondition.condition_target_questionnaire as answeroption_condition_target_questionnaire',
          'answerOptionCondition.condition_target_questionnaire_version as answeroption_condition_target_questionnaire_version',
          'answerOptionCondition.condition_question_id as answeroption_condition_question_id',
          'answerOptionCondition.condition_value as answeroption_condition_value',
          'answerOptionCondition.condition_link as answeroption_condition_link',
          'answerOptionCondition.condition_operand as answeroption_condition_operand',

          'answer_option_target_answer_option.position as answeroption_condition_target_answeroption_position',
          'answer_option_target_answer_option.variable_name as answeroption_condition_target_answeroption_variable_name',
          'answer_option_target_question.position as answeroption_condition_target_question_position',
          'answer_option_target_question.variable_name as answeroption_condition_target_question_variable_name',
          'answer_option_target_questionnaire.name as answeroption_condition_target_questionnaire_name',

          'questionCondition.condition_type as question_condition_type',
          'questionCondition.condition_target_questionnaire as question_condition_target_questionnaire',
          'questionCondition.condition_target_questionnaire_version as question_condition_target_questionnaire_version',
          'questionCondition.condition_question_id as question_condition_question_id',
          'questionCondition.condition_value as question_condition_value',
          'questionCondition.condition_link as question_condition_link',
          'questionCondition.condition_operand as question_condition_operand',

          'question_target_answer_option.position as question_condition_target_answeroption_position',
          'question_target_answer_option.variable_name as question_condition_target_answeroption_variable_name',
          'question_target_question.position as question_condition_target_question_position',
          'question_target_question.variable_name as question_condition_target_question_variable_name',
          'question_target_questionnaire.name as question_condition_target_questionnaire_name',
        ])
        .where(
          `
          questionnaire.id = :id AND
          questionnaire.version = :version
          `,
          { id: questionnaire.id, version: questionnaire.version }
        )
        .leftJoin('questionnaire.questions', 'question')
        .leftJoin('question.answerOptions', 'answerOption')
        .leftJoin('question.condition', 'questionCondition')
        .leftJoin('answerOption.condition', 'answerOptionCondition')
        .leftJoin(
          'questionnaires',
          'answer_option_target_questionnaire',
          `
          answer_option_target_questionnaire.id = answerOptionCondition.condition_target_questionnaire AND 
          answer_option_target_questionnaire.version = answerOptionCondition.condition_target_questionnaire_version
          `
        )
        .leftJoin(
          'answer_options',
          'answer_option_target_answer_option',
          'answer_option_target_answer_option.id = answerOptionCondition.condition_target_answer_option'
        )
        .leftJoin(
          'questions',
          'answer_option_target_question',
          'answer_option_target_question.id = answer_option_target_answer_option.question_id'
        )
        .leftJoin(
          'questionnaires',
          'question_target_questionnaire',
          `
          question_target_questionnaire.id = questionCondition.condition_target_questionnaire AND
          question_target_questionnaire.version = questionCondition.condition_target_questionnaire_version
          `
        )
        .leftJoin(
          'answer_options',
          'question_target_answer_option',
          'question_target_answer_option.id = questionCondition.condition_target_answer_option'
        )
        .leftJoin(
          'questions',
          'question_target_question',
          'question_target_question.id = question_target_answer_option.question_id'
        )
        .addOrderBy('question.position', 'ASC')
        .addOrderBy('answerOption.position', 'ASC')
        .stream();

      const transformStream = new CodebookTransform(questionnaire);
      const csvStream = CsvService.stringify();
      const studyName = ExportUtilities.sanitizeForFilename(
        this.options.study_name
      );
      const questionnaireName = ExportUtilities.sanitizeForFilename(
        questionnaire.name
      );

      this.archive.append(
        questionnaireStream.pipe(transformStream).pipe(csvStream),
        {
          name: `codebook_${studyName}_${questionnaireName}_v${questionnaire.version}.csv`,
        }
      );

      await promisifyStream(questionnaireStream);
    }
  }
}
