/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { isEqual } from 'date-fns';
import { AnswerOption } from '../entities/answerOption';
import { Answer, AnswerDto, AnswerValue } from '../models/answer';
import { AnswerType } from '../models/answerOption';
import {
  Condition,
  ConditionDto,
  ConditionLink,
  ConditionOperand,
  isConditionDto,
} from '../models/condition';
import { isSampleDto } from '../models/sample';
import { isUserFileDto } from '../models/userFile';

type Value = string | number | Date;

export class ConditionChecker {
  /**
   * @deprecated If you are currently working on this method, please consider refactoring it.
   * We have a great example for an optimized version, which could be extracted into a library.
   * @see psa.service.analyzerservice/src/services/conditionsService.ts
   *
   * Returns true if the value of answer meets the condition, false otherwise
   */
  public static isConditionMet(
    answer: Answer | AnswerDto | { value: AnswerValue } | undefined,
    condition: Condition | ConditionDto,
    type: AnswerType
  ): boolean {
    if (!answer) {
      return false;
    }

    const conditionIsDto = isConditionDto(condition);

    const answer_values: Value[] = conditionIsDto
      ? ConditionChecker.parseValues(
          answer.value,
          type,
          condition.targetAnswerOption ?? undefined
        )
      : ConditionChecker.parseValues(answer.value, type);

    let conditionValues: Value[];
    let conditionLink: ConditionLink;
    let conditionOperand: ConditionOperand | null;
    if (conditionIsDto) {
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
    values: AnswerValue,
    type: AnswerType,
    answerOption?: AnswerOption
  ): Value[] {
    if (values === null) {
      return [];
    }

    if (typeof values === 'string') {
      if (type === AnswerType.Number) {
        return values.split(';').map((value) => parseFloat(value));
      } else if (type === AnswerType.Date) {
        return values.split(';').map((value) => new Date(value));
      }
      return values.split(';');
    }

    if (answerOption) {
      if (type === AnswerType.SingleSelect && typeof values === 'number') {
        return [this.decodeValueCodes(values, answerOption)];
      } else if (type === AnswerType.MultiSelect && Array.isArray(values)) {
        return values.map((v) => this.decodeValueCodes(v, answerOption));
      }
    }

    if (isUserFileDto(values)) {
      return ['file'];
    }

    if (isSampleDto(values)) {
      return ['sample'];
    }

    return Array.isArray(values) ? values : [values];
  }

  private static decodeValueCodes(
    code: number | string,
    answerOption: AnswerOption
  ): string {
    if (!answerOption.valuesCode || !answerOption.values) {
      return '';
    }
    code = typeof code === 'string' ? parseFloat(code) : code;
    const index = answerOption.valuesCode.indexOf(code);
    return index != -1 ? String(answerOption.values[`${index}`]) : '';
  }
}
