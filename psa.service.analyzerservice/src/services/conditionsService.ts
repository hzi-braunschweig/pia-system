/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Answer, AnswerWithQuestionnaireInstance } from '../models/answer';
import { Condition } from '../models/condition';
import { AnswerType } from '../models/answerOption';
import isEqual from 'date-fns/isEqual';
import {
  Questionnaire,
  QuestionnaireWithConditionType,
} from '../models/questionnaire';
import { ITask } from 'pg-promise';
import { QuestionnaireInstance } from '../models/questionnaireInstance';

type AnswerValue = string | number | Date;

export class ConditionsService {
  public static async getConditionFor(
    t: ITask<unknown>,
    questionnaire: Questionnaire
  ): Promise<Condition | null> {
    return t.oneOrNone(
      'SELECT * FROM conditions WHERE condition_questionnaire_id=$(id) AND condition_questionnaire_version=$(version)',
      {
        id: questionnaire.id,
        version: questionnaire.version,
      }
    );
  }

  /**
   * Returns true if the value of answer meets the condition, false otherwise
   */
  public static isConditionMet(
    answer: Answer | undefined,
    condition: Condition,
    type: AnswerType
  ): boolean {
    if (!answer) {
      return false;
    }
    const answerValues: AnswerValue[] = this.parseValues(answer.value, type);
    const conditionValues: AnswerValue[] = this.parseValues(
      condition.condition_value,
      type
    );
    const conditionLink = condition.condition_link ?? 'OR';

    const compare = (
      answerValue: AnswerValue,
      conditionValue: AnswerValue
    ): boolean => {
      switch (condition.condition_operand) {
        case '<':
          return answerValue < conditionValue;
        case '>':
          return answerValue > conditionValue;
        case '<=':
          return answerValue <= conditionValue;
        case '>=':
          return answerValue >= conditionValue;
        case '==':
          return type === AnswerType.Date
            ? isEqual(answerValue as Date, conditionValue as Date)
            : answerValue === conditionValue;
        case '\\=':
          return type === AnswerType.Date
            ? !isEqual(answerValue as Date, conditionValue as Date)
            : answerValue !== conditionValue;
        default:
          return false;
      }
    };

    const evaluateCondition = (conditionValue: AnswerValue): boolean => {
      if (conditionValue === '') return conditionLink === 'AND';
      return answerValues.some(
        (answerValue) =>
          answerValue !== '' && compare(answerValue, conditionValue)
      );
    };

    switch (conditionLink) {
      case 'AND':
        return conditionValues.every(evaluateCondition);
      case 'OR':
        return conditionValues.some(evaluateCondition);
      case 'XOR':
        return conditionValues.filter(evaluateCondition).length === 1;
      default:
        return false;
    }
  }

  public static doesLatestAnswerMeetCondition(
    answers: Answer[],
    condition: Condition,
    type: AnswerType
  ): boolean {
    if (!answers.length) {
      return false;
    }

    const latestAnswer = answers[answers.length - 1];
    return (
      !!latestAnswer &&
      ConditionsService.isConditionMet(latestAnswer, condition, type)
    );
  }

  public static doesSatisfyExternalCondition(
    qCondition: Condition | QuestionnaireWithConditionType | null
  ): boolean {
    return qCondition?.condition_type === 'external';
  }

  public static doesSatisfyInternalCondition(
    qCondition: Condition | QuestionnaireWithConditionType | null
  ): boolean {
    return qCondition?.condition_type === 'internal_last';
  }

  public static inferReleaseVersionFromAnswers(
    answers: Answer[]
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  ): 1 | 2 | null {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return answers.length == 1 || answers.length == 2 ? answers.length : null;
  }

  public static getDateOfReleaseFromAnswers(
    answers: AnswerWithQuestionnaireInstance[]
  ): Date | null {
    const latestAnswer = answers[answers.length - 1];
    const releaseVersion = this.inferReleaseVersionFromAnswers(answers);

    if (latestAnswer && releaseVersion !== null) {
      const releaseDateProperty: keyof QuestionnaireInstance = `date_of_release_v${releaseVersion}`;
      // eslint-disable-next-line security/detect-object-injection
      return latestAnswer[releaseDateProperty];
    }

    return null;
  }

  private static parseValues(values: string, type: AnswerType): AnswerValue[] {
    if (type === AnswerType.Number) {
      return values.split(';').map((value) => parseFloat(value));
    } else if (type === AnswerType.Date) {
      return values.split(';').map((value) => new Date(value));
    } else {
      return values.split(';');
    }
  }
}
