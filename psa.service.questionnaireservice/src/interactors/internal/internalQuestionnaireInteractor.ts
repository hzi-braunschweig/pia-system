/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Boom from '@hapi/boom';
import { getRepository } from 'typeorm';
import { QuestionnaireDto } from '../../models/questionnaire';
import { Questionnaire } from '../../entities/questionnaire';
import { AnswerDataFilter } from '../../models/answer';
import { Answer } from '../../entities/answer';
import { AnswerDataTransform } from '../../services/internal/answerDataTransform';
import { StreamTimeout } from '../../helpers/streamTimeout';
import { Transform } from 'stream';

export class InternalQuestionnaireInteractor {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  private static readonly streamTimeout = 60 * 60 * 1000; // 1 hour

  public static async getQuestionnaire(
    id: number,
    version: number
  ): Promise<QuestionnaireDto> {
    try {
      return await getRepository(Questionnaire).findOneOrFail({
        where: { id, version },
        relations: ['questions', 'questions.answerOptions'],
      });
    } catch (err) {
      throw Boom.notFound('questionnaire not found');
    }
  }

  public static async getAnswers(
    id: number,
    filter: AnswerDataFilter
  ): Promise<Transform> {
    try {
      let query = getRepository(Answer)
        .createQueryBuilder('a')
        .select([
          'q.id AS questionnaire_id',
          'qi.id AS questionnaire_instance_id',
          'qi.date_of_issue AS questionnaire_instance_date_of_issue',
          'ao.id AS answer_option_id',
          'ao.variable_name AS answer_option_variable_name',
          "string_to_array(a.value, ';') AS values",
          'MAX(a.versioning) AS answer_version',
        ])
        .innerJoin('a.answerOption', 'ao')
        .innerJoin('a.questionnaireInstance', 'qi')
        .innerJoin('qi.questionnaire', 'q')
        .where('q.id = :id', { id });
      if (filter.status && filter.status.length > 0) {
        query = query.andWhere('qi.status IN (:...status)', {
          status: filter.status,
        });
      }
      if (filter.minDateOfIssue) {
        query = query.andWhere('qi.date_of_issue >= :minDateOfIssue', {
          minDateOfIssue: filter.minDateOfIssue,
        });
      }
      if (filter.maxDateOfIssue) {
        query = query.andWhere('qi.date_of_issue <= :maxDateOfIssue', {
          maxDateOfIssue: filter.maxDateOfIssue,
        });
      }
      if (filter.answerOptionIds || filter.answerOptionVariableNames) {
        let where = '(';
        if (filter.answerOptionIds?.length) {
          where += 'ao.id IN (:...answerOptionIds)';
        }
        if (
          filter.answerOptionIds?.length &&
          filter.answerOptionVariableNames?.length
        ) {
          where += ' OR ';
        }
        if (filter.answerOptionVariableNames?.length) {
          where += 'ao.variable_name IN (:...answerOptionVariableNames)';
        }
        where += ')';
        query = query.andWhere(where, {
          answerOptionIds: filter.answerOptionIds ?? [],
          answerOptionVariableNames: filter.answerOptionVariableNames ?? [],
        });
      }

      query = query
        .groupBy('q.id, q.version, qi.id, qi.date_of_issue, ao.id, a.value')
        .orderBy('qi.date_of_issue', 'ASC');

      return (await query.stream())
        .on('error', (err) => console.error(err))
        .pipe(new AnswerDataTransform())
        .pipe(new StreamTimeout(InternalQuestionnaireInteractor.streamTimeout));
    } catch (err) {
      console.error(err);
      throw Boom.internal('error while getting answers');
    }
  }
}
