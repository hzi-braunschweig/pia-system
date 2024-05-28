/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { RepositoryOptions } from '@pia/lib-service-core';
import pgPromise from 'pg-promise';
import { EntityRepository, Repository } from 'typeorm';
import { FindOneOptions } from 'typeorm/find-options/FindOneOptions';
import { db, getDbTransactionFromOptionsOrDbConnection } from '../db';
import { QuestionnaireInstance } from '../entities/questionnaireInstance';
import { QuestionnaireInstanceNotFoundError } from '../errors';
import { Questionnaire, QuestionnaireType } from '../models/questionnaire';
import {
  DbQuestionnaireInstance,
  QuestionnaireInstance as QuestionnaireInstanceDeprecated,
  QuestionnaireInstanceForPM,
  QuestionnaireInstanceStatus,
} from '../models/questionnaireInstance';
import { QuestionnaireFilterDeprecated } from '../services/questionnaireFilterDeprecated';
import {
  QuestionnaireDbResult,
  RepositoryHelper as QuestionnaireRepositoryHelper,
} from './questionnaireRepository';
import QueryResultError = pgPromise.errors.QueryResultError;
import queryResultErrorCode = pgPromise.errors.queryResultErrorCode;

const pgp = pgPromise({ capSQL: true });

interface QuestionnaireInstanceDbResult extends QuestionnaireDbResult {
  questionnaire_instance: DbQuestionnaireInstance | null;
}

class RepositoryHelper {
  public static createQuestionnaireInstanceWithQuestionnaireQuery(
    filter = '',
    order = ''
  ): string {
    return (
      `SELECT ROW_TO_JSON(qi.*)   AS questionnaire_instance,
              ROW_TO_JSON(qa.*)   AS questionnaire,
              ROW_TO_JSON(c_qa.*) AS questionnaire_cond,
              ROW_TO_JSON(q.*)    AS question,
              ROW_TO_JSON(c_q.*)  AS question_cond,
              ROW_TO_JSON(ao.*)   AS answer_option,
              ROW_TO_JSON(c_ao.*) AS answer_option_cond
       FROM questionnaire_instances AS qi
                JOIN questionnaires AS qa
                     ON qi.questionnaire_id = qa.id AND qi.questionnaire_version = qa.version
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
   * It resolves the questionnaire instances of a result of joined questionnaire instances with their  questionnaires,
   * questions, answer options and conditions
   * @param result
   * @return A Map with all of the questionnaire instances identified by their id
   */
  public static resolveDbResultToQuestionnaireInstanceMap(
    result: QuestionnaireInstanceDbResult[]
  ): Map<number, QuestionnaireInstanceDeprecated> {
    const questionnaires =
      QuestionnaireRepositoryHelper.resolveDbResultToQuestionnaireMap(result);
    const questionnaireInstances = new Map<
      number,
      QuestionnaireInstanceDeprecated
    >();
    result.forEach((row) => {
      // questionnaire instance
      if (
        row.questionnaire_instance &&
        !questionnaireInstances.has(row.questionnaire_instance.id)
      ) {
        const questionnaireInstance: QuestionnaireInstanceDeprecated = {
          ...row.questionnaire_instance,
          date_of_issue: new Date(row.questionnaire_instance.date_of_issue),
          date_of_release_v1:
            row.questionnaire_instance.date_of_release_v1 &&
            new Date(row.questionnaire_instance.date_of_release_v1),
          date_of_release_v2:
            row.questionnaire_instance.date_of_release_v2 &&
            new Date(row.questionnaire_instance.date_of_release_v2),
          questionnaire: RepositoryHelper.deepCloneQuestionnaire(
            questionnaires.get(
              row.questionnaire_instance.questionnaire_id.toString() +
                '_' +
                row.questionnaire_instance.questionnaire_version.toString()
            )!
          ),
        };
        questionnaireInstances.set(
          row.questionnaire_instance.id,
          questionnaireInstance
        );
      }
    });
    return questionnaireInstances;
  }

  private static deepCloneQuestionnaire(
    questionnaire: Questionnaire
  ): Questionnaire {
    return {
      ...questionnaire,
      questions: questionnaire.questions.map((question) => {
        return {
          ...question,
          condition: question.condition && { ...question.condition },
          answer_options: question.answer_options.map((answerOption) => {
            return {
              ...answerOption,
              condition: answerOption.condition && {
                ...answerOption.condition,
              },
            };
          }),
        };
      }),
    };
  }
}

/**
 * @deprecated
 */
export class QuestionnaireInstanceRepository {
  /**
   * gets the questionnaire instance with the specified id
   * @param id the id of the questionnaire instance to find
   * @returns a resolved promise with the found questionnaire instance or a rejected promise with the error
   */
  public static async getQuestionnaireInstanceForResearcher(
    id: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    return db.one<QuestionnaireInstanceDeprecated>(
      'SELECT * FROM questionnaire_instances WHERE id = ${id}',
      {
        id: id,
      }
    );
  }

  public static async getQuestionnaireInstanceForInvestigator(
    id: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    return this.getQuestionnaireInstanceForRole(id, 'for_research_team');
  }

  public static async getQuestionnaireInstanceForProband(
    id: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    return this.getQuestionnaireInstanceForRole(id, 'for_probands');
  }

  /**
   * Gets the questionnaire instance with the specified id filtered for probands answers
   * @param id the id of the questionnaire instance to find
   * @returns a resolved promise with the found questionnaire instance or a rejected promise with the error
   */
  public static async getQuestionnaireInstanceWithQuestionnaire(
    id: number
  ): Promise<QuestionnaireInstanceDeprecated> {
    const filter = `WHERE qi.id = $(id)`;
    const order = `ORDER BY q.position, ao.position`;
    const query =
      RepositoryHelper.createQuestionnaireInstanceWithQuestionnaireQuery(
        filter,
        order
      );
    const result = await db
      .many<QuestionnaireInstanceDbResult>(query, { id })
      .catch((err) => {
        if (
          err instanceof QueryResultError &&
          err.code === queryResultErrorCode.noData
        )
          throw new QuestionnaireInstanceNotFoundError();
        else throw err;
      });
    // if db.many runs without error there will be a qInstance -> no need to check null
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const qInstance =
      RepositoryHelper.resolveDbResultToQuestionnaireInstanceMap(result).get(
        id
      )!;
    await QuestionnaireFilterDeprecated.filterQuestionnaireOfInstance(
      qInstance
    );
    return qInstance;
  }

  /**
   * gets the questionnaire instances with the specified user id
   * @returns a resolved promise with the found questionnaire instances or a rejected promise with the error
   */
  public static async getQuestionnaireInstancesWithQuestionnaireAsResearcher(
    user_id: string
  ): Promise<QuestionnaireInstanceDeprecated[]> {
    const actualQInstances = [];
    const resultQInstances =
      await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireForUserStatusAndType(
        user_id,
        [
          'released_once',
          'released_twice',
          'released',
          'active',
          'in_progress',
          'expired',
          'deleted',
        ],
        ['for_probands', 'for_research_team']
      );
    for (const qi of resultQInstances) {
      await QuestionnaireFilterDeprecated.filterQuestionnaireOfInstance(qi);
      if (qi.questionnaire.questions.length > 0) {
        actualQInstances.push(qi);
      }
    }
    return actualQInstances;
  }

  /**
   * gets the questionnaire instances with the specified user id as a proband
   * @returns a resolved promise with the found questionnaire instances or a rejected promise with the error
   */
  public static async getQuestionnaireInstancesWithQuestionnaireAsProband(
    user_id: string,
    status: QuestionnaireInstanceStatus[]
  ): Promise<QuestionnaireInstanceDeprecated[]> {
    const actualQInstances = [];
    const resultQInstances =
      await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireForUserStatusAndType(
        user_id,
        status,
        'for_probands'
      ).catch((e) => {
        if (e instanceof pgp.errors.QueryResultError) {
          return [];
        } else {
          throw e;
        }
      });
    for (const qi of resultQInstances) {
      await QuestionnaireFilterDeprecated.filterQuestionnaireOfInstance(qi);
      if (qi.questionnaire.questions.length > 0) {
        actualQInstances.push(qi);
      }
    }
    return actualQInstances;
  }

  /**
   * gets the questionnaire instances with the specified user id as a PM
   * @returns a resolved promise with the found questionnaire instances or a rejected promise with the error
   */
  public static async getQuestionnaireInstancesWithQuestionnaireAsPM(
    user_id: string
  ): Promise<QuestionnaireInstanceForPM[]> {
    const actualQInstances: QuestionnaireInstanceForPM[] = [];
    const resultQInstances =
      await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireForUserStatusAndType(
        user_id,
        ['released_once', 'released_twice'],
        'for_probands'
      );
    for (const qi of resultQInstances) {
      await QuestionnaireFilterDeprecated.filterQuestionnaireOfInstance(qi);
      if (qi.questionnaire.questions.length > 0) {
        actualQInstances.push({
          ...qi,
          questionnaire: {
            id: qi.questionnaire.id,
            cycle_unit: qi.questionnaire.cycle_unit,
          },
        });
      }
    }
    return actualQInstances;
  }

  /**
   * gets the questionnaire instances with the specified user id as a UT
   * @returns a resolved promise with the found questionnaire instances or a rejected promise with the error
   */
  public static async getQuestionnaireInstancesAsInvestigator(
    user_id: string
  ): Promise<QuestionnaireInstanceDeprecated[]> {
    const actualQInstances = [];
    const resultQInstances =
      await QuestionnaireInstanceRepository.getQuestionnaireInstancesWithQuestionnaireForUserStatusAndType(
        user_id,
        ['released', 'active', 'in_progress'],
        'for_research_team'
      );
    for (const qi of resultQInstances) {
      await QuestionnaireFilterDeprecated.filterQuestionnaireOfInstance(qi);
      if (qi.questionnaire.questions.length > 0) {
        actualQInstances.push(qi);
      }
    }
    return actualQInstances;
  }

  public static async deleteQuestionnaireInstancesByQuestionnaireId(
    questionnaireId: number,
    questionnaireVersion: number,
    status: QuestionnaireInstanceStatus[],
    options?: RepositoryOptions
  ): Promise<void> {
    const dbConnection = getDbTransactionFromOptionsOrDbConnection(options);
    const filter = {
      questionnaireId,
      questionnaireVersion,
      status,
    };
    await dbConnection.none(
      'DELETE FROM questionnaire_instances WHERE questionnaire_id = $(questionnaireId) AND questionnaire_version = $(questionnaireVersion) AND status IN ($(status:csv))',
      filter
    );
  }

  private static async getQuestionnaireInstancesWithQuestionnaireForUserStatusAndType(
    user_id: string,
    status: QuestionnaireInstanceStatus[],
    type: QuestionnaireType | QuestionnaireType[]
  ): Promise<QuestionnaireInstanceDeprecated[]> {
    const filter = `WHERE qi.user_id = $(user_id)
                         AND qi.status IN ($(status:csv))
                         AND qa.type IN ($(type:csv))`;
    const order = `ORDER BY qi.id, q.position, ao.position`;
    const query =
      RepositoryHelper.createQuestionnaireInstanceWithQuestionnaireQuery(
        filter,
        order
      );
    const result = await db.many<QuestionnaireInstanceDbResult>(query, {
      user_id,
      status,
      type,
    });
    return Array.from(
      RepositoryHelper.resolveDbResultToQuestionnaireInstanceMap(
        result
      ).values()
    );
  }

  private static async getQuestionnaireInstanceForRole(
    id: number,
    role: 'for_probands' | 'for_research_team'
  ): Promise<QuestionnaireInstanceDeprecated> {
    return db.one<QuestionnaireInstanceDeprecated>(
      `SELECT qi.*
       FROM questionnaire_instances AS qi
                JOIN questionnaires q ON qi.questionnaire_id = q.id AND qi.questionnaire_version = q.version
       WHERE qi.id = $(id)
         AND qi.status != 'deleted'
         AND q.type = $(role)`,
      { id, role }
    );
  }
}

@EntityRepository(QuestionnaireInstance)
export class CustomQuestionnaireInstanceRepository extends Repository<QuestionnaireInstance> {
  private readonly questionnaireRelations = [
    'questionnaire',
    'questionnaire.condition',
    'questionnaire.questions',
    'questionnaire.questions.condition',
    'questionnaire.questions.answerOptions',
    'questionnaire.questions.answerOptions.condition',
  ];

  private readonly targetAnswerOptionRelations = [
    // to be able to evaluate conditions, we need the targetAnswerOption
    'questionnaire.questions.condition.targetAnswerOption',
    'questionnaire.questions.answerOptions.condition.targetAnswerOption',
  ];

  public async findOneOrFailByIdWithQuestionnaire(
    options: FindOneOptions<QuestionnaireInstance>
  ): Promise<QuestionnaireInstance> {
    this.addQuestionnaireRelations(options);
    return this.findOneOrFail(options);
  }

  public async findWithQuestionnaire(
    options: FindOneOptions<QuestionnaireInstance>
  ): Promise<QuestionnaireInstance[]> {
    this.addQuestionnaireRelations(options);
    return this.find(options);
  }

  public async findOneWithAllConditionRelations(
    options: FindOneOptions<QuestionnaireInstance>
  ): Promise<QuestionnaireInstance | undefined> {
    this.addQuestionnaireRelations(options);
    this.addRelationsToEvaluateConditions(options);

    return this.findOne(options);
  }

  private addQuestionnaireRelations(
    options: FindOneOptions<QuestionnaireInstance>
  ): void {
    if (!options.relations) {
      options.relations = [];
    }
    options.relations.push(...this.questionnaireRelations);
  }

  private addRelationsToEvaluateConditions(
    options: FindOneOptions<QuestionnaireInstance>
  ): void {
    if (!options.relations) {
      options.relations = [];
    }
    options.relations.push(...this.targetAnswerOptionRelations);
  }
}
