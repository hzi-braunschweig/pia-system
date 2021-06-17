const { db } = require('../db');

function getDateToCheckCondition(qInstance, questionnaire) {
  let dateToCheckCondition;
  if (['released', 'released_twice'].includes(qInstance.status)) {
    dateToCheckCondition = qInstance.date_of_release_v2;
  }
  if (
    !dateToCheckCondition &&
    ['released', 'released_once'].includes(qInstance.status)
  ) {
    dateToCheckCondition = qInstance.date_of_release_v1;
  }
  if (!dateToCheckCondition && questionnaire.cycle_unit !== 'spontan') {
    dateToCheckCondition = qInstance.date_of_issue;
  }
  if (!dateToCheckCondition) {
    dateToCheckCondition = new Date();
  }
  return dateToCheckCondition;
}

/**
 *
 * @param {QuestionnaireInstance} qInstance
 * @return {Promise<undefined|Questionnaire>}
 */
async function filterQuestionnaireOfInstance(qInstance) {
  const questionnaire = { ...qInstance.questionnaire };
  const questionsToAdd = [];
  // Go through questions and determine if it should be added based on conditions
  for (let i = 0; i < questionnaire.questions.length; i++) {
    const curQuestion = { ...questionnaire.questions[i] };
    let addQuestion = true;
    if (curQuestion.condition) {
      let targetInstance;
      if (curQuestion.condition.condition_type === 'external') {
        targetInstance = await db.oneOrNone(
          `SELECT id
                     FROM questionnaire_instances
                     WHERE questionnaire_id = $(id)
                       AND questionnaire_version = $(version)
                       AND status IN ('released_once', 'released_twice', 'released')
                       AND (date_of_release_v1 <= $(dateOfCurrent) OR status = 'released')
                       AND user_id = $(userId)
                     ORDER BY date_of_release_v1 DESC
                     LIMIT 1`,
          {
            id: curQuestion.condition.condition_target_questionnaire,
            version:
              curQuestion.condition.condition_target_questionnaire_version,
            dateOfCurrent: getDateToCheckCondition(qInstance, questionnaire),
            userId: qInstance.user_id,
          }
        );
        if (!targetInstance) {
          addQuestion = false;
        }
      } else if (
        curQuestion.condition.condition_type === 'internal_last' &&
        qInstance.cycle > 1
      ) {
        targetInstance = await db.oneOrNone(
          `SELECT id
                     FROM questionnaire_instances
                     WHERE questionnaire_id = $(id)
                       AND questionnaire_version = $(version)
                       AND status IN ('released_once', 'released_twice', 'released')
                       AND cycle = $(cycle)
                       AND user_id = $(userId)
                     ORDER BY date_of_release_v1 DESC
                     LIMIT 1`,
          {
            id: questionnaire.id,
            version: questionnaire.version,
            cycle: qInstance.cycle - 1,
            userId: qInstance.user_id,
          }
        );
      }
      if (targetInstance) {
        const targetAnswerOptionResult = await db.one(
          'SELECT * FROM answer_options WHERE id=$1',
          [curQuestion.condition.condition_target_answer_option]
        );
        const targetAnswerResult = await db.manyOrNone(
          'SELECT * FROM answers WHERE answer_option_id=$1 AND questionnaire_instance_id=$2 ORDER BY versioning',
          [
            curQuestion.condition.condition_target_answer_option,
            targetInstance.id,
          ]
        );
        if (targetAnswerResult.length === 2) {
          addQuestion = isConditionMet(
            targetAnswerResult[1],
            curQuestion.condition,
            targetAnswerOptionResult.answer_type_id
          );
        } else if (targetAnswerResult.length === 1) {
          addQuestion = isConditionMet(
            targetAnswerResult[0],
            curQuestion.condition,
            targetAnswerOptionResult.answer_type_id
          );
        } else {
          addQuestion = false;
        }
      }
    }
    if (addQuestion) {
      const answerOptionsToAdd = [];
      let addEmptyQuestion = false;
      if (curQuestion.answer_options.length === 0) {
        addEmptyQuestion = true;
      }
      // Go through answer_options of question and determine if it should be added based on conditions
      for (let j = 0; j < curQuestion.answer_options.length; j++) {
        const curAnswerOption = { ...curQuestion.answer_options[j] };
        let addAnswerOption = true;
        if (curAnswerOption.condition) {
          let targetInstance;
          if (curAnswerOption.condition.condition_type === 'external') {
            targetInstance = await db.oneOrNone(
              `SELECT id
                             FROM questionnaire_instances
                             WHERE questionnaire_id = $(id)
                               AND questionnaire_version = $(version)
                               AND status IN ('released_once', 'released_twice', 'released')
                               AND (date_of_release_v1 <= $(dateOfCurrent) OR status = 'released')
                               AND user_id = $(userId)
                             ORDER BY date_of_release_v1 DESC
                             LIMIT 1`,
              {
                id: curAnswerOption.condition.condition_target_questionnaire,
                version:
                  curAnswerOption.condition
                    .condition_target_questionnaire_version,
                dateOfCurrent: getDateToCheckCondition(
                  qInstance,
                  questionnaire
                ),
                userId: qInstance.user_id,
              }
            );
            if (!targetInstance) {
              addAnswerOption = false;
            }
          } else if (
            curAnswerOption.condition.condition_type === 'internal_last' &&
            qInstance.cycle > 1
          ) {
            targetInstance = await db.oneOrNone(
              `SELECT id
                             FROM questionnaire_instances
                             WHERE questionnaire_id = $(id)
                               AND questionnaire_version = $(version)
                               AND status IN ('released_once', 'released_twice', 'released')
                               AND cycle = $(cycle)
                               AND user_id = $(userId)
                             ORDER BY date_of_release_v1 DESC
                             LIMIT 1`,
              {
                id: questionnaire.id,
                version: questionnaire.version,
                cycle: qInstance.cycle - 1,
                userId: qInstance.user_id,
              }
            );
          }
          if (targetInstance) {
            const targetAnswerOptionResult = await db.one(
              'SELECT * FROM answer_options WHERE id=$1',
              [curAnswerOption.condition.condition_target_answer_option]
            );
            const targetAnswerResult = await db.manyOrNone(
              'SELECT * FROM answers WHERE answer_option_id=$1 AND questionnaire_instance_id=$2 ORDER BY versioning',
              [
                curAnswerOption.condition.condition_target_answer_option,
                targetInstance.id,
              ]
            );
            if (targetAnswerResult.length == 2) {
              addAnswerOption = isConditionMet(
                targetAnswerResult[1],
                curAnswerOption.condition,
                targetAnswerOptionResult.answer_type_id
              );
            } else if (targetAnswerResult.length == 1) {
              addAnswerOption = isConditionMet(
                targetAnswerResult[0],
                curAnswerOption.condition,
                targetAnswerOptionResult.answer_type_id
              );
            } else {
              addAnswerOption = false;
            }
          }
        }
        if (addAnswerOption) {
          answerOptionsToAdd.push(curAnswerOption);
        }
      }
      if (answerOptionsToAdd.length > 0 || addEmptyQuestion) {
        curQuestion.answer_options = answerOptionsToAdd;
        questionsToAdd.push(curQuestion);
      }
    }
  }
  if (questionsToAdd.length > 0) {
    questionnaire.questions = questionsToAdd;
    return checkForEmptyQuestionsQuestionnaire(
      filterInternalConditions(questionnaire)
    );
  } else return undefined;
}
exports.filterQuestionnaireOfInstance = filterQuestionnaireOfInstance;
/**
 *
 * @param {Questionnaire} questionnaire
 * @return {Questionnaire|undefined}
 */
function checkForEmptyQuestionsQuestionnaire(questionnaire) {
  if (!questionnaire) return undefined;
  const notOnlyEmptyQuestions = questionnaire.questions.some(function (
    question
  ) {
    if (question.answer_options.length > 0) {
      return true;
    }
  });
  return notOnlyEmptyQuestions ? questionnaire : undefined;
}

function shouldAddQuestion(question, questions) {
  let addQuestion = true;

  if (question.condition !== null && question.condition !== undefined) {
    if (question.condition.condition_type === 'internal_this') {
      const target_answer_option_id =
        question.condition.condition_target_answer_option;
      let foundAnswerOption;
      const foundQuestion = questions.find(function (question_for_search) {
        foundAnswerOption = question_for_search.answer_options.find(function (
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
          addQuestion = shouldAddQuestion(foundQuestion, questions);
        }
        if (addQuestion)
          addQuestion = shouldAddAnswerOption(
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

    question.answer_options.forEach(function (answer_option) {
      let addAnswerOption = true;
      if (
        answer_option.condition !== null &&
        answer_option.condition !== undefined
      ) {
        if (answer_option.condition.condition_type === 'internal_this') {
          const target_answer_option_id =
            answer_option.condition.condition_target_answer_option;
          let foundAnswerOption;
          const foundQuestion = questions.find(function (question_for_search) {
            foundAnswerOption = question_for_search.answer_options.find(
              function (answer_option_for_search) {
                return answer_option_for_search.id === target_answer_option_id;
              }
            );
            return foundAnswerOption ? true : false;
          });
          if (!foundQuestion) {
            addAnswerOption = false;
          } else {
            if (question.id !== foundQuestion.id) {
              addAnswerOption = shouldAddQuestion(foundQuestion, questions);
            }
            if (addAnswerOption)
              addAnswerOption = shouldAddAnswerOption(
                question,
                foundAnswerOption,
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

function shouldAddAnswerOption(question, answer_option, questions) {
  let addAnswerOption = true;

  if (
    answer_option.condition !== null &&
    answer_option.condition !== undefined
  ) {
    if (answer_option.condition.condition_type === 'internal_this') {
      const target_answer_option_id =
        answer_option.condition.condition_target_answer_option;
      let foundQuestion = null;
      let foundAnswerOption = null;
      // Use for loops here because of  Maximum call stack size exceeded exception!
      for (let i = 0; i < questions.length; i++) {
        const question_for_search = questions[i];
        for (let j = 0; j < question_for_search.answer_options.length; j++) {
          const answer_option_for_search =
            question_for_search.answer_options[j];
          if (answer_option_for_search.id === target_answer_option_id) {
            foundAnswerOption = answer_option_for_search;
            break;
          }
        }
        if (foundAnswerOption) {
          foundQuestion = question_for_search;
          break;
        }
      }
      if (!foundQuestion) {
        addAnswerOption = false;
      } else {
        if (question.id !== foundQuestion.id) {
          addAnswerOption = shouldAddQuestion(foundQuestion, questions);
        }
        if (addAnswerOption)
          addAnswerOption = shouldAddAnswerOption(
            question,
            foundAnswerOption,
            questions
          );
      }
    }
  }
  return addAnswerOption;
}

function filterInternalConditions(questionnaire) {
  const questionsToAdd = [];

  questionnaire.questions.forEach(function (question) {
    let addQuestion = true;
    question = { ...question };

    if (question.condition !== null && question.condition !== undefined) {
      if (question.condition.condition_type === 'internal_this') {
        const target_answer_option_id =
          question.condition.condition_target_answer_option;
        let foundAnswerOption;
        const foundQuestion = questionnaire.questions.find(function (
          question_for_search
        ) {
          foundAnswerOption = question_for_search.answer_options.find(function (
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
            addQuestion = shouldAddQuestion(
              foundQuestion,
              questionnaire.questions
            );
          }
          if (addQuestion)
            addQuestion = shouldAddAnswerOption(
              question,
              foundAnswerOption,
              questionnaire.questions
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

      question.answer_options.forEach(function (answer_option) {
        answer_option = { ...answer_option };
        let addAnswerOption = true;
        if (
          answer_option.condition !== null &&
          answer_option.condition !== undefined
        ) {
          if (answer_option.condition.condition_type === 'internal_this') {
            const target_answer_option_id =
              answer_option.condition.condition_target_answer_option;
            let foundAnswerOption;
            const foundQuestion = questionnaire.questions.find(function (
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
                addAnswerOption = shouldAddQuestion(
                  foundQuestion,
                  questionnaire.questions
                );
              }
              if (addAnswerOption)
                addAnswerOption = shouldAddAnswerOption(
                  question,
                  foundAnswerOption,
                  questionnaire.questions
                );
            }
          }
        }
        if (addAnswerOption) {
          answerOptionsToAdd.push(answer_option);
        }
      });

      if (answerOptionsToAdd.length > 0 || addEmptyQuestion) {
        question.answer_options = answerOptionsToAdd;
        questionsToAdd.push(question);
      }
    }
  });
  if (questionsToAdd.length > 0) {
    questionnaire.questions = questionsToAdd;
    return questionnaire;
  } else return null;
}
exports.filterInternalConditions = filterInternalConditions;

function isConditionMet(answer, condition, type) {
  let answer_values = [];
  let condition_values = [];
  if (type === 3) {
    answer_values = answer.value.split(';').map(function (value) {
      return parseFloat(value);
    });
    condition_values = condition.condition_value
      .split(';')
      .map(function (value) {
        return parseFloat(value);
      });
  } else if (type === 5) {
    answer_values = answer.value.split(';').map(function (value) {
      return new Date(value);
    });
    condition_values = condition.condition_value
      .split(';')
      .map(function (value) {
        return new Date(value);
      });
  } else {
    answer_values = answer.value.split(';');
    condition_values = condition.condition_value.split(';');
  }

  const condition_link = condition.condition_link
    ? condition.condition_link
    : 'OR';

  switch (condition.condition_operand) {
    case '<':
      if (condition_link === 'AND') {
        return condition_values.every(function (condition_value) {
          if (condition_value === '') return true;
          return answer_values.some(function (answer_value) {
            return answer_value !== '' ? answer_value < condition_value : false;
          });
        });
      } else if (condition_link === 'OR') {
        return condition_values.some(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== '' ? answer_value < condition_value : false;
          });
        });
      } else if (condition_link === 'XOR') {
        const count = condition_values.filter(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== '' ? answer_value < condition_value : false;
          });
        }).length;
        return count === 1;
      }
      break;

    case '>':
      if (condition_link === 'AND') {
        return condition_values.every(function (condition_value) {
          if (condition_value === '') return true;
          return answer_values.some(function (answer_value) {
            return answer_value !== '' ? answer_value > condition_value : false;
          });
        });
      } else if (condition_link === 'OR') {
        return condition_values.some(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== '' ? answer_value > condition_value : false;
          });
        });
      } else if (condition_link === 'XOR') {
        const count = condition_values.filter(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== '' ? answer_value > condition_value : false;
          });
        }).length;
        return count === 1;
      }
      break;

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
      }
      break;

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
      }
      break;

    case '==':
      if (condition_link === 'AND') {
        return condition_values.every(function (condition_value) {
          if (condition_value === '') return true;
          return answer_values.some(function (answer_value) {
            return answer_value !== ''
              ? type === 5
                ? answer_value.equals(condition_value)
                : answer_value === condition_value
              : false;
          });
        });
      } else if (condition_link === 'OR') {
        return condition_values.some(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== ''
              ? type === 5
                ? answer_value.equals(condition_value)
                : answer_value === condition_value
              : false;
          });
        });
      } else if (condition_link === 'XOR') {
        const count = condition_values.filter(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== ''
              ? type === 5
                ? answer_value.equals(condition_value)
                : answer_value === condition_value
              : false;
          });
        }).length;
        return count === 1;
      }
      break;

    case '\\=':
      if (condition_link === 'AND') {
        return condition_values.every(function (condition_value) {
          if (condition_value === '') return true;
          return answer_values.some(function (answer_value) {
            return answer_value !== ''
              ? type === 5
                ? !answer_value.equals(condition_value)
                : answer_value !== condition_value
              : false;
          });
        });
      } else if (condition_link === 'OR') {
        return condition_values.some(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== ''
              ? type === 5
                ? !answer_value.equals(condition_value)
                : answer_value !== condition_value
              : false;
          });
        });
      } else if (condition_link === 'XOR') {
        const count = condition_values.filter(function (condition_value) {
          if (condition_value === '') return false;
          return answer_values.some(function (answer_value) {
            return answer_value !== ''
              ? type === 5
                ? !answer_value.equals(condition_value)
                : answer_value !== condition_value
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
exports.isConditionMet = isConditionMet;
