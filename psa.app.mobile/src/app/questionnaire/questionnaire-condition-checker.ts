import { FormArray, FormControl } from '@angular/forms';
import { isEqual } from 'date-fns';

import {
  AnswerOption,
  AnswerType,
  Condition,
  Question,
} from './questionnaire.model';
import { FormControlValue } from './questionnaire-form/questionnaire-form.service';

/**
 * Wrapper for an AnswerOption
 *
 * Additionally stores the array index of the Question and the Answer,
 * the AnswerOption belongs to. Simplifies the search for the
 * corresponding form control with
 * {@link QuestionnaireDetailPage.getFormControlAtPosition()}
 */
interface AnswerOptionData {
  answerOption: AnswerOption;
  questionIndex: number;
  answerIndex: number;
}

export class QuestionnaireConditionChecker {
  /**
   * Improves the performance for the search of referenced AnswerOptions.
   */
  private answerOptionsMap: Map<number, AnswerOptionData> =
    QuestionnaireConditionChecker.createAnswerOptionsMap(this.questions);

  constructor(private questions: Question[]) {}

  private static createAnswerOptionsMap(
    questions: Question[]
  ): Map<number, AnswerOptionData> {
    const answerOptionsMap = new Map<number, AnswerOptionData>();
    questions.forEach((question, questionIndex) => {
      question.answer_options.forEach((answerOption, answerIndex) => {
        answerOptionsMap.set(answerOption.id, {
          answerOption,
          questionIndex,
          answerIndex,
        });
      });
    });
    return answerOptionsMap;
  }

  private static getFormControlAtPosition(
    questionnaireForm: FormArray,
    questionIndex: number,
    answerIndex: number
  ): FormControl {
    return (questionnaireForm.at(questionIndex) as FormArray).at(
      answerIndex
    ) as FormControl;
  }

  isConditionMet(questionnaireForm: FormArray, condition: Condition): boolean {
    if (!condition || condition.condition_type !== 'internal_this') {
      return true;
    }

    const targetAnswerOptionData: AnswerOptionData = this.answerOptionsMap.get(
      condition.condition_target_answer_option
    );
    const targetAnswerType = targetAnswerOptionData.answerOption.answer_type_id;
    const targetAnswerValue: FormControlValue =
      QuestionnaireConditionChecker.getFormControlAtPosition(
        questionnaireForm,
        targetAnswerOptionData.questionIndex,
        targetAnswerOptionData.answerIndex
      ).value;
    const answerValues = Array.isArray(targetAnswerValue)
      ? targetAnswerValue
      : [targetAnswerValue];

    if (targetAnswerValue === null) {
      return false;
    }

    let conditionValues;
    if (targetAnswerType === AnswerType.Number) {
      conditionValues = condition.condition_value.split(';').map(parseFloat);
    } else if (targetAnswerType === AnswerType.Date) {
      conditionValues = condition.condition_value
        .split(';')
        .map((value) => new Date(value));
    } else {
      conditionValues = condition.condition_value.split(';');
    }

    const conditionLink = condition.condition_link
      ? condition.condition_link
      : 'OR';

    switch (condition.condition_operand) {
      case '<':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value < conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value < conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value < conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '>':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value > conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value > conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value > conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '<=':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value <= conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value <= conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value <= conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '>=':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value >= conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value >= conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value >= conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '==':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? isEqual(value as Date, conditionValue)
                  : value === conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? isEqual(value as Date, conditionValue)
                  : value === conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? isEqual(value as Date, conditionValue)
                  : value === conditionValue
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '\\=':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? !isEqual(value as Date, conditionValue)
                  : value !== conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? !isEqual(value as Date, conditionValue)
                  : value !== conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? !isEqual(value as Date, conditionValue)
                  : value !== conditionValue
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      default:
        return false;
    }
  }
}
