/**
 * @description helper methods for questionnaires and their related elements
 */
import { Answer, AnswerType } from '../models/Answer';
import { Condition } from '../models/Condition';
import { isEqual } from 'date-fns';
import { Question } from '../models/Question';
import { AnswerOption } from '../models/AnswserOption';

export class QuestionnaireHelper {
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
    const answer_values: (string | number | Date)[] = this.parseValues(
      answer.value,
      type
    );
    const condition_values: (string | number | Date)[] = this.parseValues(
      condition.condition_value,
      type
    );
    const condition_link = condition.condition_link ?? 'OR';

    switch (condition.condition_operand) {
      case '<':
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
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
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
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
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
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
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
            if (condition_value === '') return false;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
          // a general else clause which catches all other values is not what we want here
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
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
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? isEqual(answer_value as Date, condition_value as Date)
                  : answer_value === condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
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
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
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
        if (condition_link === 'AND') {
          return condition_values.every(function (condition_value) {
            if (condition_value === '') return true;
            return answer_values.some(function (answer_value) {
              return answer_value !== ''
                ? type === AnswerType.Date
                  ? !isEqual(answer_value as Date, condition_value as Date)
                  : answer_value !== condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some(function (condition_value) {
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
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter(function (condition_value) {
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

  /**
   * Returns TRUE if:
   * 1. the question's condition does not lead to empty questions or answer options
   * AND
   * 2. the question's answer options do not have conditions that lead to empty questions or answer options
   * Otherwise returns FALSE
   */
  public static questionAndRelatedElementsNotEmpty(
    question: Question,
    questions: Question[]
  ): boolean {
    let addQuestion = true;

    if (question.condition) {
      // Checks if the condition does not lead to empty questions or answer options
      if (question.condition.condition_type === 'internal_this') {
        const target_answer_option_id =
          question.condition.condition_target_answer_option;
        let foundAnswerOption = null;
        const foundQuestion = questions.find(function (questionForSearch) {
          foundAnswerOption = questionForSearch.answer_options.find(function (
            answer_option_for_search
          ) {
            return answer_option_for_search.id === target_answer_option_id;
          });
          return foundAnswerOption ? true : false;
        });
        if (!foundQuestion) {
          addQuestion = false;
        } else {
          if (question.id !== foundQuestion.id) {
            addQuestion =
              QuestionnaireHelper.questionAndRelatedElementsNotEmpty(
                foundQuestion,
                questions
              );
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          if (addQuestion && foundAnswerOption)
            addQuestion = this.answerOptionAndRelatedElementsNotEmpty(
              question,
              foundAnswerOption,
              questions
            );
        }
      }
    }

    if (addQuestion) {
      const answerOptionsToAdd = [];
      let addEmptyQuestion = false;
      if (question.answer_options.length === 0) {
        addEmptyQuestion = true;
      }

      // Checks if all answer options do not have conditions that lead to empty questions or answer options
      question.answer_options.forEach(function (answer_option) {
        let addAnswerOption = true;
        if (answer_option.condition) {
          if (answer_option.condition.condition_type === 'internal_this') {
            const target_answer_option_id =
              answer_option.condition.condition_target_answer_option;
            let foundAnswerOption;
            const foundQuestion = questions.find(function (
              question_for_search
            ) {
              foundAnswerOption = question_for_search.answer_options.find(
                function (answer_option_for_search) {
                  return (
                    answer_option_for_search.id === target_answer_option_id
                  );
                }
              );
              return foundAnswerOption ? true : false;
            });
            if (!foundQuestion) {
              addAnswerOption = false;
            } else {
              if (question.id !== foundQuestion.id) {
                addAnswerOption =
                  QuestionnaireHelper.questionAndRelatedElementsNotEmpty(
                    foundQuestion,
                    questions
                  );
              }
              if (addAnswerOption)
                addAnswerOption =
                  QuestionnaireHelper.questionAndRelatedElementsNotEmpty(
                    question,
                    questions
                  );
            }
          }
        }
        if (addAnswerOption) {
          answerOptionsToAdd.push(answer_option);
        }
      });

      if (answerOptionsToAdd.length == 0 && !addEmptyQuestion) {
        addQuestion = false;
      }
    }
    return addQuestion;
  }

  /**
   * Returns TRUE if:
   * the answer option's condition does not lead to empty questions or answer options
   * Otherwise returns FALSE
   */
  public static answerOptionAndRelatedElementsNotEmpty(
    question: Question,
    answer_option: AnswerOption,
    questions: Question[]
  ): boolean {
    let addAnswerOption = true;

    // Checks if the condition does not lead to empty questions or answer options
    if (answer_option.condition) {
      if (answer_option.condition.condition_type === 'internal_this') {
        const target_answer_option_id =
          answer_option.condition.condition_target_answer_option;
        let foundQuestion = null;
        let foundAnswerOption = null;
        // Use for loops here because of Maximum call stack size exceeded exception!
        for (const questionForSearch of questions) {
          for (const answerOptionForSearch of questionForSearch.answer_options) {
            if (answerOptionForSearch.id === target_answer_option_id) {
              foundAnswerOption = answerOptionForSearch;
              break;
            }
          }
          if (foundAnswerOption) {
            foundQuestion = questionForSearch;
            break;
          }
        }
        if (!foundQuestion) {
          addAnswerOption = false;
        } else {
          if (question.id !== foundQuestion.id) {
            addAnswerOption =
              QuestionnaireHelper.questionAndRelatedElementsNotEmpty(
                foundQuestion,
                questions
              );
          }
          if (addAnswerOption && foundAnswerOption)
            addAnswerOption = this.answerOptionAndRelatedElementsNotEmpty(
              question,
              foundAnswerOption,
              questions
            );
        }
      }
    }
    return addAnswerOption;
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
