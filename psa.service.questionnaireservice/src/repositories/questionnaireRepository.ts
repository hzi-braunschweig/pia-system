/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DbQuestionnaire, Questionnaire } from '../models/questionnaire';
import { DbCondition } from '../models/condition';
import { DbQuestion, Question } from '../models/question';
import { AnswerOption, DbAnswerOption } from '../models/answerOption';
import { RepositoryOptions } from '@pia/lib-service-core';
import { getDbTransactionFromOptionsOrDbConnection } from '../db';

export interface QuestionnaireDbResult {
  questionnaire: DbQuestionnaire | null;
  questionnaire_cond: DbCondition | null;
  question: DbQuestion | null;
  question_cond: DbCondition | null;
  answer_option: DbAnswerOption | null;
  answer_option_cond: DbCondition | null;
}

export class RepositoryHelper {
  public static readonly latestQuestionnaireVersionQuery =
    'SELECT version FROM questionnaires WHERE id=$1 ORDER BY version DESC LIMIT 1';

  public static createQuestionnaireQuery(filter = '', order = ''): string {
    return (
      `SELECT ROW_TO_JSON(qa.*)   AS questionnaire,
                ROW_TO_JSON(c_qa.*) AS questionnaire_cond,
                ROW_TO_JSON(q.*)    AS question,
                ROW_TO_JSON(c_q.*)  AS question_cond,
                ROW_TO_JSON(ao.*)   AS answer_option,
                ROW_TO_JSON(c_ao.*) AS answer_option_cond
         FROM questionnaires AS qa
                LEFT OUTER JOIN conditions AS c_qa
                                ON qa.id = c_qa.condition_questionnaire_id AND
                                   qa.version = c_qa.condition_questionnaire_version
                LEFT OUTER JOIN questions AS q
                                ON qa.id = q.questionnaire_id AND qa.version = q.questionnaire_version
                LEFT OUTER JOIN conditions AS c_q ON q.id = c_q.condition_question_id
                LEFT OUTER JOIN answer_options ao ON q.id = ao.question_id
                LEFT OUTER JOIN conditions AS c_ao ON ao.id = c_ao.condition_answer_option_id
        ` +
      filter +
      '\n' +
      order
    );
  }

  /**
   * It resolves the questionnaires of a result of joined questionnaires with their questions, answer options and conditions
   * @param result
   * @return A Map with all of the questionnaires questionnaire identified by "<id>_<version>"
   */
  public static resolveDbResultToQuestionnaireMap(
    result: QuestionnaireDbResult[]
  ): Map<string, Questionnaire> {
    const questionnaires = new Map<string, Questionnaire>();
    const questions = new Map<number, Question>();
    const answer_options = new Map<number, AnswerOption>();

    result.forEach((row: QuestionnaireDbResult) => {
      // questionnaire
      if (
        row.questionnaire &&
        !questionnaires.has(
          row.questionnaire.id.toString() +
            '_' +
            row.questionnaire.version.toString()
        )
      ) {
        const questionnaire: Questionnaire = {
          ...row.questionnaire,
          activate_at_date:
            row.questionnaire.activate_at_date &&
            new Date(row.questionnaire.activate_at_date),
          created_at:
            row.questionnaire.created_at &&
            new Date(row.questionnaire.created_at),
          condition: row.questionnaire_cond,
          questions: [],
        };
        questionnaires.set(
          row.questionnaire.id.toString() +
            '_' +
            row.questionnaire.version.toString(),
          questionnaire
        );
      }
      // question
      if (row.question && !questions.has(row.question.id)) {
        const question: Question = {
          ...row.question,
          answer_options: [],
          condition: row.question_cond,
        };
        questions.set(row.question.id, question);
        questionnaires
          .get(
            row.question.questionnaire_id.toString() +
              '_' +
              row.question.questionnaire_version.toString()
          )
          ?.questions.push(question);
      }
      // answer option
      if (row.answer_option && !answer_options.has(row.answer_option.id)) {
        const answerOption: AnswerOption = {
          ...row.answer_option,
          condition: row.answer_option_cond,
        };
        answer_options.set(row.answer_option.id, answerOption);
        questions
          .get(row.answer_option.question_id)
          ?.answer_options.push(answerOption);
      }
    });
    return questionnaires;
  }
}

export class QuestionnaireRepository {
  public static async deactivateQuestionnaire(
    id: number,
    version: number,
    options?: RepositoryOptions
  ): Promise<void> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    const filter = {
      id,
      version,
    };
    await db.none(
      'UPDATE questionnaires SET active = FALSE WHERE id = $(id) AND version = $(version)',
      filter
    );
  }

  public static async getQuestionnaire(
    id: number,
    version?: number,
    options?: RepositoryOptions
  ): Promise<Questionnaire> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.tx(async (t) => {
      if (!version) {
        version = (
          await t.one<{ version: number }>(
            RepositoryHelper.latestQuestionnaireVersionQuery,
            id
          )
        ).version;
      }
      const filter = `WHERE qa.id = $(id)
                         AND qa.version = $(version)`;
      const order = `ORDER BY q.position, ao.position`;
      const query = RepositoryHelper.createQuestionnaireQuery(filter, order);
      const result = await t.many(query, { id, version });
      return RepositoryHelper.resolveDbResultToQuestionnaireMap(result).get(
        id.toString() + '_' + version.toString()
      )!;
    });
  }

  public static async getQuestionnairesByStudyIds(
    ids: string[],
    options?: RepositoryOptions
  ): Promise<Questionnaire[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    const filter = `WHERE qa.study_id IN ($(ids:csv))`;
    const order = `ORDER BY qa.id, q.position, ao.position`;
    const query = RepositoryHelper.createQuestionnaireQuery(filter, order);
    const result = await db.many(query, { ids });
    return Array.from(
      RepositoryHelper.resolveDbResultToQuestionnaireMap(result).values()
    );
  }
}
