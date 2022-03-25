/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QuestionnaireDto } from '../models/questionnaire';
import { QuestionnaireInstanceDto } from '../models/questionnaireInstance';
import { AnswerDto } from '../models/answer';
import { ConditionDto, ConditionType } from '../models/condition';
import { endOfDay } from 'date-fns';
import { QuestionCleaner } from './questionCleaner';
import { ConditionChecker } from './conditionChecker';
import { getRepository, In, LessThanOrEqual } from 'typeorm';
import { Answer } from '../entities/answer';

export class QuestionnaireFilter {
  private conditionTargetAnswers: Map<number, AnswerDto> = new Map<
    number,
    AnswerDto
  >();

  private constructor(private readonly qInstance: QuestionnaireInstanceDto) {}

  /**
   * Filters the questionnaires question in place
   */
  public static async filterQuestionnaireOfInstance(
    qInstance: QuestionnaireInstanceDto
  ): Promise<void> {
    await new QuestionnaireFilter(qInstance).runFilterQuestionnaireOfInstance();
  }

  private async runFilterQuestionnaireOfInstance(): Promise<void> {
    if (
      !this.qInstance.questionnaire ||
      !this.qInstance.questionnaire.questions
    ) {
      return;
    }
    await this.loadConditionTargetAnswers();

    // Go through questions and determine if it should be added based on conditions
    this.qInstance.questionnaire.questions =
      this.qInstance.questionnaire.questions
        .filter((question) => {
          return this.isConditionFulfilled(question.condition);
        })
        .filter((question) => {
          // Go through answer_options of question and determine if it should be added based on conditions
          const keepEmptyQuestion =
            question.answerOptions === undefined ||
            question.answerOptions.length === 0;
          question.answerOptions = question.answerOptions?.filter(
            (answerOption) => {
              return this.isConditionFulfilled(answerOption.condition);
            }
          );
          return (
            keepEmptyQuestion ||
            (question.answerOptions && question.answerOptions.length > 0)
          );
        });

    // Cleanup questions with internal conditions that now point on a none existing answer option
    this.qInstance.questionnaire.questions = new QuestionCleaner(
      this.qInstance.questionnaire.questions
    ).getQuestionsToAdd();

    if (
      !this.qInstance.questionnaire.questions.some(
        (question) =>
          question.answerOptions && question.answerOptions.length > 0
      )
    ) {
      // if there is no answer option empty questions can also be deleted.
      this.qInstance.questionnaire.questions = [];
    }
  }

  private isConditionFulfilled(
    condition: ConditionDto | null | undefined
  ): boolean {
    if (
      condition &&
      (condition.type === ConditionType.EXTERNAL ||
        condition.type === ConditionType.INTERNAL_LAST)
    ) {
      const answer =
        condition.targetAnswerOption &&
        this.conditionTargetAnswers.get(condition.targetAnswerOption.id);
      if (answer) {
        return ConditionChecker.isConditionMet(
          answer,
          condition,
          answer.answerOption!.answerTypeId
        );
      } else if (condition.type === ConditionType.EXTERNAL) {
        // if getConditionTargetAnswers did not find a target, condition is not fulfilled
        return false;
      } else if (this.qInstance.cycle > 1) {
        // if getConditionTargetAnswers did not find a target and it's not the first cycle, condition is not full filled
        return false;
      }
    }
    return true;
  }

  private getConditionTargetAnswerOptionIdsForType(
    questionnaire: QuestionnaireDto,
    conditionType: ConditionType
  ): number[] {
    const conditionTargetAnswerOptionIds: number[] = [];
    questionnaire.questions?.forEach((question) => {
      if (question.condition?.type === conditionType) {
        question.condition.targetAnswerOption &&
          conditionTargetAnswerOptionIds.push(
            question.condition.targetAnswerOption.id
          );
      }
      question.answerOptions?.forEach((answerOption) => {
        if (answerOption.condition?.type === conditionType) {
          answerOption.condition.targetAnswerOption &&
            conditionTargetAnswerOptionIds.push(
              answerOption.condition.targetAnswerOption.id
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
        this.qInstance.questionnaire!,
        ConditionType.EXTERNAL
      );
    const answerRepo = getRepository(Answer);
    if (externalConditionTargetAnswerOptionIds.length > 0) {
      const endOfDayOfIssue = endOfDay(this.qInstance.dateOfIssue);
      const externalConditionTargetAnswers = await answerRepo.find({
        where: [
          {
            answerOption: In(externalConditionTargetAnswerOptionIds),
            questionnaireInstance: {
              status: In(['released', 'released_once', 'released_twice']),
              pseudonym: this.qInstance.pseudonym,
            },
            dateOfRelease: LessThanOrEqual(endOfDayOfIssue),
          },
          {
            answerOption: In(externalConditionTargetAnswerOptionIds),
            questionnaireInstance: {
              status: In(['released', 'released_once', 'released_twice']),
              pseudonym: this.qInstance.pseudonym,
              dateOfReleaseV1: LessThanOrEqual(endOfDayOfIssue),
              dateOfReleaseV2: null,
            },
          },
          {
            answerOption: In(externalConditionTargetAnswerOptionIds),
            questionnaireInstance: {
              status: In(['released', 'released_once', 'released_twice']),
              pseudonym: this.qInstance.pseudonym,
              dateOfReleaseV2: LessThanOrEqual(endOfDayOfIssue),
            },
          },
        ],
        relations: ['answerOption', 'questionnaireInstance'],
        order: {
          answerOption: 'ASC',
          versioning: 'DESC',
        },
      });
      externalConditionTargetAnswers.forEach((answer) => {
        if (!this.conditionTargetAnswers.has(answer.answerOption!.id)) {
          // the array is ordered by version descending. if a later version was already stored ignore the older version.
          this.conditionTargetAnswers.set(answer.answerOption!.id, answer);
        }
      });
    }

    if (this.qInstance.cycle > 1) {
      const internalLastConditionTargetAnswerOptionIds =
        this.getConditionTargetAnswerOptionIdsForType(
          this.qInstance.questionnaire!,
          ConditionType.INTERNAL_LAST
        );
      if (internalLastConditionTargetAnswerOptionIds.length > 0) {
        const internalLastConditionTargetAnswers = await answerRepo.find({
          where: {
            answerOption: In(externalConditionTargetAnswerOptionIds),
            questionnaireInstance: {
              status: In(['released', 'released_once', 'released_twice']),
              pseudonym: this.qInstance.pseudonym,
              cycle: this.qInstance.cycle - 1,
            },
          },
          relations: ['answerOption', 'questionnaireInstance'],
          order: {
            answerOption: 'ASC',
            versioning: 'DESC',
          },
        });
        internalLastConditionTargetAnswers.forEach((answer) => {
          if (!this.conditionTargetAnswers.has(answer.answerOption!.id)) {
            // the array is ordered by version descending. if a later version was already stored ignore the older version.
            this.conditionTargetAnswers.set(answer.answerOption!.id, answer);
          }
        });
      }
    }
  }
}
