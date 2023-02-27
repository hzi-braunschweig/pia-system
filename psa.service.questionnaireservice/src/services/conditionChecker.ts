/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Condition,
  ConditionDto,
  ConditionLink,
  ConditionOperand,
  isConditionDto,
} from '../models/condition';
import { Answer, AnswerDto } from '../models/answer';
import { isEqual } from 'date-fns';
import { AnswerType } from '../models/answerOption';

export class ConditionChecker {
  /**
   * Returns true if the value of answer meets the condition, false otherwise
   */
  public static isConditionMet(
    answer: Answer | AnswerDto | { value: string } | undefined,
    condition: Condition | ConditionDto,
    type: AnswerType
  ): boolean {
    if (!answer) {
      return false;
    }
    const answer_values: (string | number | Date)[] =
      ConditionChecker.parseValues(answer.value, type);

    let conditionValues: (string | number | Date)[];
    let conditionLink: ConditionLink;
    let conditionOperand: ConditionOperand | null;
    if (isConditionDto(condition)) {
      conditionValues = ConditionChecker.parseValues(
        condition.value ?? '',
        type
      );
      conditionLink = condition.link ?? condition.link ?? 'OR';
      conditionOperand = condition.operand;
    } else {
      conditionValues = ConditionChecker.parseValues(
        condition.condition_value ?? '',
        type
      );
      conditionLink = condition.condition_link ?? 'OR';
      conditionOperand = condition.condition_operand;
    }

    switch (conditionOperand) {
      case '<':
        if (conditionLink === 'AND') {
          return conditionValues.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '>':
        if (conditionLink === 'AND') {
          return conditionValues.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '<=':
        if (conditionLink === 'AND') {
          return conditionValues.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '>=':
        if (conditionLink === 'AND') {
          return conditionValues.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '==':
        if (conditionLink === 'AND') {
          return conditionValues.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      case '\\=':
        if (conditionLink === 'AND') {
          return conditionValues.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          }).length;
          return count === 1;
        } else {
          return false;
        }

      default:
        return false;
    }
  }

  private static parseValues(
    values: string,
    type: AnswerType
  ): (string | number | Date)[] {
    if (type === AnswerType.Number) {
      return values.split(';').map((value) => parseFloat(value));
    } else if (type === AnswerType.Date) {
      return values.split(';').map((value) => new Date(value));
    } else {
      return values.split(';');
    }
  }
}
