import { db } from '../db';
import { Questionnaire } from '../models/questionnaire';
import { Condition } from '../models/condition';
import { Question } from '../models/question';
import { AnswerOption } from '../models/answerOption';

export interface QuestionnaireDbResult {
  questionnaire?: Questionnaire;
  questionnaire_cond?: Condition;
  question?: Question;
  question_cond?: Condition;
  answer_option?: AnswerOption;
  answer_option_cond?: Condition;
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
        row.questionnaire.condition = row.questionnaire_cond;
        row.questionnaire.questions = [];
        questionnaires.set(
          row.questionnaire.id.toString() +
            '_' +
            row.questionnaire.version.toString(),
          row.questionnaire
        );
      }
      // question
      if (row.question && !questions.has(row.question.id)) {
        row.question.condition = row.question_cond;
        row.question.answer_options = [];
        questions.set(row.question.id, row.question);
        questionnaires
          .get(
            row.question.questionnaire_id.toString() +
              '_' +
              row.question.questionnaire_version.toString()
          )
          ?.questions?.push(row.question);
      }
      // answer option
      if (row.answer_option && !answer_options.has(row.answer_option.id)) {
        row.answer_option.condition = row.answer_option_cond;
        questions
          .get(row.answer_option.question_id)
          ?.answer_options.push(row.answer_option);
        answer_options.set(row.answer_option.id, row.answer_option);
      }
    });
    return questionnaires;
  }
}

export class QuestionnaireRepository {
  public static async getQuestionnaire(
    id: number,
    version: number
  ): Promise<Questionnaire | undefined> {
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
      );
    });
  }

  public static async getQuestionnairesByStudyIds(
    ids: string
  ): Promise<Questionnaire[]> {
    const filter = `WHERE qa.study_id IN ($(ids:csv))`;
    const order = `ORDER BY qa.id, q.position, ao.position`;
    const query = RepositoryHelper.createQuestionnaireQuery(filter, order);
    const result = await db.many(query, { ids });
    return Array.from(
      RepositoryHelper.resolveDbResultToQuestionnaireMap(result).values()
    );
  }
}
