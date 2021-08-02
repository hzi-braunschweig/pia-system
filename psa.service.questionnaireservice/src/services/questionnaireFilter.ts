/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Questionnaire } from '../models/questionnaire';
import { QuestionnaireInstance } from '../models/questionnaireInstance';
import { Answer } from '../models/answer';
import { Condition, ConditionType } from '../models/condition';
import { db } from '../db';
import { endOfDay } from 'date-fns';
import { QuestionCleaner } from './questionCleaner';
import { ConditionChecker } from './conditionChecker';
import { AnswerType } from '../models/answerOption';

interface AnswerWithType extends Answer {
  answer_type_id: AnswerType;
}

export class QuestionnaireFilter {
  private conditionTargetAnswers: Map<number, AnswerWithType> = new Map<
    number,
    AnswerWithType
  >();

  private constructor(private readonly qInstance: QuestionnaireInstance) {}

  /**
   * Filters the questionnaires question in place
   * @param {QuestionnaireInstance} qInstance
   * @return {Promise<undefined|Questionnaire>}
   */
  public static async filterQuestionnaireOfInstance(
    qInstance: QuestionnaireInstance
  ): Promise<void> {
    await new QuestionnaireFilter(qInstance).runFilterQuestionnaireOfInstance();
  }

  private async runFilterQuestionnaireOfInstance(): Promise<void> {
    await this.loadConditionTargetAnswers();

    // Go through questions and determine if it should be added based on conditions
    this.qInstance.questionnaire.questions =
      this.qInstance.questionnaire.questions
        .filter((question) => {
          return this.isConditionFulfilled(question.condition);
        })
        .filter((question) => {
          // Go through answer_options of question and determine if it should be added based on conditions
          const keepEmptyQuestion = question.answer_options.length === 0;
          question.answer_options = question.answer_options.filter(
            (answerOption) => {
              return this.isConditionFulfilled(answerOption.condition);
            }
          );
          return keepEmptyQuestion || question.answer_options.length > 0;
        });

    // Cleanup questions with internal conditions that now point on a none existing answer option
    this.qInstance.questionnaire.questions = new QuestionCleaner(
      this.qInstance.questionnaire.questions
    ).getQuestionsToAdd();

    if (
      !this.qInstance.questionnaire.questions.some(
        (question) => question.answer_options.length > 0
      )
    ) {
      // if there is no answer option empty questions can also be deleted.
      this.qInstance.questionnaire.questions = [];
    }
  }

  private isConditionFulfilled(condition: Condition | null): boolean {
    if (
      condition &&
      (condition.condition_type === ConditionType.EXTERNAL ||
        condition.condition_type === ConditionType.INTERNAL_LAST)
    ) {
      const answer =
        condition.condition_target_answer_option &&
        this.conditionTargetAnswers.get(
          condition.condition_target_answer_option
        );
      if (answer) {
        return ConditionChecker.isConditionMet(
          answer,
          condition,
          answer.answer_type_id
        );
      } else if (condition.condition_type === ConditionType.EXTERNAL) {
        // if getConditionTargetAnswers did not find a target, condition is not full filled
        return false;
      } else if (this.qInstance.cycle > 1) {
        // if getConditionTargetAnswers did not find a target and it's not the first cycle, condition is not full filled
        return false;
      }
    }
    return true;
  }

  private getConditionTargetAnswerOptionIdsForType(
    questionnaire: Questionnaire,
    conditionType: ConditionType
  ): number[] {
    const conditionTargetAnswerOptionIds: number[] = [];
    questionnaire.questions.forEach((question) => {
      if (question.condition?.condition_type === conditionType) {
        question.condition.condition_target_answer_option &&
          conditionTargetAnswerOptionIds.push(
            question.condition.condition_target_answer_option
          );
      }
      question.answer_options.forEach((answerOption) => {
        if (answerOption.condition?.condition_type === conditionType) {
          answerOption.condition.condition_target_answer_option &&
            conditionTargetAnswerOptionIds.push(
              answerOption.condition.condition_target_answer_option
            );
        }
      });
    });
    return conditionTargetAnswerOptionIds;
  }

  private async loadConditionTargetAnswers(): Promise<void> {
    this.conditionTargetAnswers = new Map();
    const externalConditionTargetAnswerOptionIds =
      this.getConditionTargetAnswerOptionIdsForType(
        this.qInstance.questionnaire,
        ConditionType.EXTERNAL
      );
    if (externalConditionTargetAnswerOptionIds.length > 0) {
      const externalConditionTargetAnswers =
        await db.manyOrNone<AnswerWithType>(
          `SELECT DISTINCT ON (a.answer_option_id) a.*, ao.answer_type_id
                     FROM answers AS a
                              JOIN questionnaire_instances qi ON a.questionnaire_instance_id = qi.id
                              JOIN answer_options ao ON ao.id = a.answer_option_id
                     WHERE status IN ('released', 'released_once', 'released_twice')
                       AND a.answer_option_id IN ($(aoIDs:csv))
                       AND qi.user_id = $(userId)
                       AND COALESCE(a.date_of_release, qi.date_of_release_v2, qi.date_of_release_v1) <=
                           $(endOfDayOfIssue)
                     ORDER BY a.answer_option_id, a.versioning DESC`,
          {
            aoIDs: externalConditionTargetAnswerOptionIds,
            /* endOfDay is needed for now - until date_of_issue is the real issue timestamp - because a QI Y that was issued
                                                    after the answer of QI X gets the start of that day as date_of_issue. Conditions inside that QI Y would not
                                                    relate to QI X because QI X was released later on that day. */
            endOfDayOfIssue: endOfDay(this.qInstance.date_of_issue),
            userId: this.qInstance.user_id,
          }
        );
      externalConditionTargetAnswers.forEach((answer) =>
        this.conditionTargetAnswers.set(answer.answer_option_id, answer)
      );
    }
    if (this.qInstance.cycle > 1) {
      const internalLastConditionTargetAnswerOptionIds =
        this.getConditionTargetAnswerOptionIdsForType(
          this.qInstance.questionnaire,
          ConditionType.INTERNAL_LAST
        );
      if (internalLastConditionTargetAnswerOptionIds.length > 0) {
        const internalLastConditionTargetAnswers =
          await db.manyOrNone<AnswerWithType>(
            `SELECT DISTINCT ON (a.answer_option_id) a.*, ao.answer_type_id
                         FROM answers AS a
                                  JOIN questionnaire_instances qi ON a.questionnaire_instance_id = qi.id
                                  JOIN answer_options ao ON ao.id = a.answer_option_id
                         WHERE status IN ('released', 'released_once', 'released_twice')
                           AND a.answer_option_id IN ($(aoIDs:csv))
                           AND qi.user_id = $(userId)
                           AND qi.cycle = $(cycle)
                         ORDER BY a.answer_option_id, a.versioning DESC`,
            {
              aoIDs: internalLastConditionTargetAnswerOptionIds,
              cycle: this.qInstance.cycle - 1,
              userId: this.qInstance.user_id,
            }
          );
        internalLastConditionTargetAnswers.forEach((answer) =>
          this.conditionTargetAnswers.set(answer.answer_option_id, answer)
        );
      }
    }
  }
}
