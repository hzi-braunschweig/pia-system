const addDays = require('date-fns/addDays');
const addHours = require('date-fns/addHours');
const subDays = require('date-fns/subDays');

const { db } = require('../db');

const defaultEmailNotificationTime = '07:00';
const defaultEmailNotificationDay = 0;

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  function getActiveQuestionnaireInstances() {
    return db.manyOrNone(
      "SELECT * FROM questionnaire_instances WHERE notifications_scheduled=false AND status IN ('active', 'in_progress')"
    );
  }

  async function countOpenQuestionnaireInstances(username) {
    return (
      await db.one(
        `SELECT count(*)
                 FROM questionnaire_instances as qi
                          JOIN questionnaires as q
                               ON qi.questionnaire_id = q.id and qi.questionnaire_version = q.version
                 WHERE qi.status IN ('active', 'in_progress')
                   AND q.cycle_unit != 'spontan'
               AND qi.user_id = $(username)`,
        { username }
      )
    ).count;
  }

  function getQuestionnaireInstance(id) {
    return db.oneOrNone('SELECT * FROM questionnaire_instances WHERE id=$1', [
      id,
    ]);
  }

  function getUserNotificationSettings(user_id) {
    return db.one(
      'SELECT notification_time, compliance_labresults FROM users WHERE username=$1',
      [user_id]
    );
  }

  const latestQuestionnaireVersionQuery =
    '\
                    SELECT version FROM questionnaires WHERE id=$1 ORDER BY version DESC LIMIT 1 \
                ';

  async function getQuestionnaireNotificationSettings(
    questionnaire_id,
    version
  ) {
    if (!version) {
      version = (
        await db.one(latestQuestionnaireVersionQuery, questionnaire_id)
      ).version;
    }
    return db.one(
      'SELECT notification_tries, notification_title, notification_body_new, notification_body_in_progress, notification_interval, notification_interval_unit, cycle_unit FROM questionnaires WHERE id=$1 AND version=$2',
      [questionnaire_id, version]
    );
  }

  function getTokenAndDeviceForUser(user_id) {
    return db.one(
      'SELECT fcm_token,logged_in_with,first_logged_in_at FROM users WHERE username=$1',
      [user_id]
    );
  }

  function updateFCMToken(user_id, token) {
    return db.one(
      'UPDATE users SET fcm_token=$1 WHERE username=$2 RETURNING fcm_token',
      [token, user_id]
    );
  }

  async function getTokenAndDeviceForUserIfAllowed(requester, username) {
    const role = await db.one('SELECT role FROM users WHERE username=$1', [
      requester,
    ]);
    if (role.role === 'SysAdmin') {
      return await db.one(
        'SELECT fcm_token,logged_in_with FROM users WHERE username=$1 AND role!=$2',
        [username, 'Proband']
      );
    } else {
      return await db.one(
        'SELECT fcm_token,logged_in_with FROM users WHERE username=${username} AND username=ANY(SELECT user_id FROM study_users WHERE study_id=ANY(SELECT study_id FROM study_users WHERE user_id=${requester}))',
        { username: username, requester: requester }
      );
    }
  }

  async function getStudiesWithPMEmail() {
    return await db.manyOrNone(
      'SELECT * FROM studies WHERE pm_email IS NOT NULL'
    );
  }

  async function getStudiesWithHUBEmail() {
    return await db.manyOrNone(
      'SELECT * FROM studies WHERE hub_email IS NOT NULL'
    );
  }

  async function getNewSampledSamplesForStudy(study_id) {
    return await db.manyOrNone(
      'SELECT id FROM lab_results WHERE CAST(date_of_sampling AS TIMESTAMP) BETWEEN $1 AND $2 AND user_id=ANY(SELECT user_id FROM study_users WHERE study_id = $3)',
      [Date.today().add(-1).days(), Date.today(), study_id]
    );
  }

  async function getNewAnalyzedSamplesForStudy(study_id) {
    const queryString =
      'SELECT lr.id, user_id, dummy_sample_id FROM lab_results as lr ' +
      'LEFT JOIN (SELECT id, lab_result_id, MAX(date_of_announcement) FROM lab_observations GROUP BY id) lo on lr.id = lo.lab_result_id ' +
      'WHERE CAST(date_of_announcement AS TIMESTAMP) BETWEEN $1 AND $2 ' +
      'AND user_id=ANY(SELECT user_id FROM study_users WHERE study_id = $3)';
    return await db.manyOrNone(queryString, [
      subDays(new Date(), 1),
      new Date(),
      study_id,
    ]);
  }

  async function markInstanceAsScheduled(id) {
    return await db.none(
      'UPDATE questionnaire_instances SET notifications_scheduled=$1 WHERE id=$2',
      [true, id]
    );
  }

  async function insertNotificationSchedule(schedule) {
    return await db.none(
      'INSERT INTO notification_schedules(user_id, send_on, notification_type, reference_id) VALUES($1:csv)',
      [schedule]
    );
  }

  async function insertCustomNotificationSchedule(schedule) {
    return await db.one(
      'INSERT INTO notification_schedules(user_id, send_on, notification_type, reference_id, title, body) VALUES($1:csv) RETURNING *',
      [schedule]
    );
  }

  async function getAllDueNotifications() {
    return await db.manyOrNone(
      'SELECT * FROM notification_schedules WHERE send_on < $1',
      [new Date()]
    );
  }

  async function getAllNotificationsForUser(user_id) {
    // Only get qReminder schedules for questionnaires that have no hourly cycle
    return await db.manyOrNone(
      `SELECT *
             FROM notification_schedules
             WHERE user_id = $1
               AND (
                 notification_type != $2 OR (
                     notification_type = $2 AND reference_id:: int IN (
                     SELECT id FROM questionnaire_instances WHERE questionnaire_id IN (
                     SELECT id FROM questionnaires WHERE cycle_unit != $3
                     )
                     )
                     )
                 )`,
      [user_id, 'qReminder', 'hour']
    );
  }

  async function getNotificationById(id) {
    return await db.one('SELECT * FROM notification_schedules WHERE id=$1', [
      id,
    ]);
  }

  async function updateTimeForNotification(id, date) {
    return await db.none(
      'UPDATE notification_schedules SET send_on=$1 WHERE id=$2',
      [date, id]
    );
  }

  async function deleteScheduledNotification(id) {
    return await db.none('DELETE FROM notification_schedules WHERE id=$1', [
      id,
    ]);
  }

  async function deleteScheduledNotificationByInstanceId(id) {
    return await db.none(
      'DELETE FROM notification_schedules WHERE reference_id=$1 AND notification_type=$2',
      [id, 'qReminder']
    );
  }

  async function postponeNotificationByInstanceId(id) {
    return db.tx(async (t) => {
      const notifications = await t.manyOrNone(
        'SELECT * FROM notification_schedules WHERE reference_id=$1 AND notification_type=$2',
        [id, 'qReminder']
      );
      for (let i = 0; i < notifications.length; i++) {
        await t.none(
          'UPDATE notification_schedules SET send_on=$1 WHERE id=$2 AND notification_type=$3',
          [
            addDays(new Date(notifications[i].send_on), 1),
            notifications[i].id,
            'qReminder',
          ]
        );
      }
      return;
    });
  }

  async function postponeNotification(id) {
    return db.tx(async (t) => {
      const notification = await t.one(
        'SELECT * FROM notification_schedules WHERE id=$1',
        [id]
      );
      return await t.none(
        'UPDATE notification_schedules SET send_on=$1 WHERE id=$2',
        [addDays(new Date(notification.send_on), 1), notification.id]
      );
    });
  }

  async function postponeNotificationByOneHour(id) {
    return db.tx(async (t) => {
      const notification = await t.one(
        'SELECT * FROM notification_schedules WHERE id=$1',
        [id]
      );
      return await t.none(
        'UPDATE notification_schedules SET send_on=$1 WHERE id=$2',
        [addHours(new Date(notification.send_on), 1), notification.id]
      );
    });
  }

  async function getLabResult(id) {
    return await db.one('SELECT * FROM lab_results WHERE id=$1', [id]);
  }

  async function getFilteredQuestionnaireForInstance(qInstance) {
    const questionnaire = await getQuestionnaire(
      qInstance.questionnaire_id,
      qInstance.questionnaire_version
    );
    const questionsToAdd = [];
    // Go through questions and determine if it should be added based on conditions
    for (let i = 0; i < questionnaire.questions.length; i++) {
      const curQuestion = questionnaire.questions[i];
      let addQuestion = true;
      if (
        curQuestion.condition !== null &&
        curQuestion.condition !== undefined
      ) {
        if (curQuestion.condition.condition_type === 'external') {
          const targetInstancesResult = await db.manyOrNone(
            'SELECT id,CAST(date_of_release_v1 AS DATE) FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$7 AND (status IN ($2, $3, $4)) AND (CAST(date_of_release_v1 AS DATE)<=$5 OR status = $4) AND user_id=$6',
            [
              curQuestion.condition.condition_target_questionnaire,
              'released_once',
              'released_twice',
              'released',
              questionnaire.cycle_unit === 'spontan'
                ? new Date()
                : qInstance.date_of_issue,
              qInstance.user_id,
              curQuestion.condition.condition_target_questionnaire_version,
            ]
          );
          if (targetInstancesResult.length > 0) {
            const targetInstanceId = getClosestPastInstanceId(
              targetInstancesResult,
              qInstance.date_of_issue
            );
            const targetAnswerOptionResult = await db.one(
              'SELECT * FROM answer_options WHERE id=$1',
              [curQuestion.condition.condition_target_answer_option]
            );
            const targetAnswerResult = await db.manyOrNone(
              'SELECT * FROM answers WHERE answer_option_id=$1 AND questionnaire_instance_id=$2 ORDER BY versioning',
              [
                curQuestion.condition.condition_target_answer_option,
                targetInstanceId,
              ]
            );
            if (targetAnswerResult.length == 2) {
              addQuestion = isConditionMet(
                targetAnswerResult[1],
                curQuestion.condition,
                targetAnswerOptionResult.answer_type_id
              );
            } else if (targetAnswerResult.length == 1) {
              addQuestion = isConditionMet(
                targetAnswerResult[0],
                curQuestion.condition,
                targetAnswerOptionResult.answer_type_id
              );
            } else {
              addQuestion = false;
            }
          } else {
            addQuestion = false;
          }
        } else if (
          curQuestion.condition.condition_type === 'internal_last' &&
          qInstance.cycle > 1
        ) {
          const targetInstancesResult = await db.manyOrNone(
            'SELECT id,CAST(date_of_release_v1 AS DATE) FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$7 AND cycle=$2 AND user_id=$3 AND (status IN ($4, $5, $6))',
            [
              questionnaire.id,
              qInstance.cycle - 1,
              qInstance.user_id,
              'released_once',
              'released_twice',
              'released',
              questionnaire.version,
            ]
          );
          if (targetInstancesResult.length > 0) {
            const targetInstanceId = getClosestPastInstanceId(
              targetInstancesResult,
              qInstance.date_of_issue
            );
            const targetAnswerOptionResult = await db.one(
              'SELECT * FROM answer_options WHERE id=$1',
              [curQuestion.condition.condition_target_answer_option]
            );
            const targetAnswerResult = await db.manyOrNone(
              'SELECT * FROM answers WHERE answer_option_id=$1 AND questionnaire_instance_id=$2 ORDER BY versioning',
              [
                curQuestion.condition.condition_target_answer_option,
                targetInstanceId,
              ]
            );
            if (targetAnswerResult.length == 2) {
              addQuestion = isConditionMet(
                targetAnswerResult[1],
                curQuestion.condition,
                targetAnswerOptionResult.answer_type_id
              );
            } else if (targetAnswerResult.length == 1) {
              addQuestion = isConditionMet(
                targetAnswerResult[0],
                curQuestion.condition,
                targetAnswerOptionResult.answer_type_id
              );
            } else {
              addQuestion = false;
            }
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
          const curAnswerOption = curQuestion.answer_options[j];
          let addAnswerOption = true;
          if (
            curAnswerOption.condition !== null &&
            curAnswerOption.condition !== undefined
          ) {
            if (curAnswerOption.condition.condition_type === 'external') {
              const targetInstancesResult = await db.manyOrNone(
                'SELECT id,CAST(date_of_release_v1 AS DATE) FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$7 AND status IN ($2, $3, $4) AND (CAST(date_of_release_v1 AS DATE)<=$5 OR status=$4) AND user_id=$6',
                [
                  curAnswerOption.condition.condition_target_questionnaire,
                  'released_once',
                  'released_twice',
                  'released',
                  questionnaire.cycle_unit === 'spontan'
                    ? new Date()
                    : qInstance.date_of_issue,
                  qInstance.user_id,
                  curAnswerOption.condition
                    .condition_target_questionnaire_version,
                ]
              );
              if (targetInstancesResult.length > 0) {
                const targetInstanceId = getClosestPastInstanceId(
                  targetInstancesResult,
                  qInstance.date_of_issue
                );
                const targetAnswerOptionResult = await db.one(
                  'SELECT * FROM answer_options WHERE id=$1',
                  [curAnswerOption.condition.condition_target_answer_option]
                );
                const targetAnswerResult = await db.manyOrNone(
                  'SELECT * FROM answers WHERE answer_option_id=$1 AND questionnaire_instance_id=$2 ORDER BY versioning',
                  [
                    curAnswerOption.condition.condition_target_answer_option,
                    targetInstanceId,
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
              } else {
                addAnswerOption = false;
              }
            } else if (
              curAnswerOption.condition.condition_type === 'internal_last' &&
              qInstance.cycle > 1
            ) {
              const targetInstancesResult = await db.manyOrNone(
                'SELECT id,CAST(date_of_release_v1 AS DATE) FROM questionnaire_instances WHERE questionnaire_id=$1 AND questionnaire_version=$7 AND cycle=$2 AND user_id=$3 AND (status IN ($4, $5, $6))',
                [
                  questionnaire.id,
                  qInstance.cycle - 1,
                  qInstance.user_id,
                  'released_once',
                  'released_twice',
                  'released',
                  questionnaire.version,
                ]
              );
              if (targetInstancesResult.length > 0) {
                const targetInstanceId = getClosestPastInstanceId(
                  targetInstancesResult,
                  qInstance.date_of_issue
                );
                const targetAnswerOptionResult = await db.one(
                  'SELECT * FROM answer_options WHERE id=$1',
                  [curAnswerOption.condition.condition_target_answer_option]
                );
                const targetAnswerResult = await db.manyOrNone(
                  'SELECT * FROM answers WHERE answer_option_id=$1 AND questionnaire_instance_id=$2 ORDER BY versioning',
                  [
                    curAnswerOption.condition.condition_target_answer_option,
                    targetInstanceId,
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
    } else return null;
  }

  function checkForEmptyQuestionsQuestionnaire(questionnaire) {
    if (questionnaire === null) return null;
    const notOnlyEmptyQuestions = questionnaire.questions.some(function (
      question
    ) {
      if (question.answer_options.length > 0) {
        return true;
      }
    });
    return notOnlyEmptyQuestions ? questionnaire : null;
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

      if (question.condition !== null && question.condition !== undefined) {
        if (question.condition.condition_type === 'internal_this') {
          const target_answer_option_id =
            question.condition.condition_target_answer_option;
          let foundAnswerOption;
          const foundQuestion = questionnaire.questions.find(function (
            question_for_search
          ) {
            foundAnswerOption = question_for_search.answer_options.find(
              function (answer_option_for_search) {
                return answer_option_for_search.id === target_answer_option_id;
              }
            );
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

  function getClosestPastInstanceId(instances, reference) {
    instances.forEach(function (curInstance) {
      curInstance.dateDiff = reference - curInstance.date_of_release_v1;
    });
    const res = Math.min.apply(
      Math,
      instances.map(function (o) {
        return o.dateDiff;
      })
    );
    const obj = instances.find(function (o) {
      return o.dateDiff == res;
    });
    return obj.id;
  }

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
        }
        break;

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

  function getQuestionnaire(id, version) {
    return db.tx(async (t) => {
      // Get questionnaire and condition
      const questionnaireResult = await t.one(
        'SELECT * FROM questionnaires WHERE id = ${qId} AND version = ${qVersion}',
        {
          qId: id,
          qVersion: version,
        }
      );
      const questionnaireConditionsResult = await t.oneOrNone(
        'SELECT * FROM conditions WHERE condition_questionnaire_id = ${qId} AND condition_questionnaire_version = ${qVersion}',
        {
          qId: id,
          qVersion: version,
        }
      );
      // Get questions and their conditions
      const questionsResult = await t.many(
        'SELECT * FROM questions WHERE questionnaire_id=$1 AND questionnaire_version=$2 ORDER BY position',
        [id, version]
      );
      const questionsConditionsResult = await t.manyOrNone(
        'SELECT * FROM conditions WHERE condition_question_id=ANY(SELECT id FROM questions WHERE questionnaire_id=$1 AND questionnaire_version=$2)',
        [id, version]
      );
      // Get answer options and their conditions
      const answerOptionsResult = await t.manyOrNone(
        'SELECT * FROM answer_options WHERE question_id = ANY(SELECT id FROM questions WHERE questionnaire_id = ${qId} AND questionnaire_version = ${qVersion}) ORDER BY position',
        {
          qId: id,
          qVersion: version,
        }
      );
      const answerOptionsConditionsResult = await t.manyOrNone(
        'SELECT * FROM conditions WHERE condition_answer_option_id=ANY(SELECT id FROM answer_options WHERE question_id = ANY(SELECT id FROM questions WHERE questionnaire_id = $1 AND questionnaire_version = $2))',
        [id, version]
      );

      const returnObject = questionnaireResult;
      if (questionnaireConditionsResult) {
        returnObject.condition = questionnaireConditionsResult;
      }
      returnObject.questions = questionsResult;
      returnObject.questions.forEach(function (question) {
        questionsConditionsResult.forEach(function (condition) {
          if (question.id === condition.condition_question_id) {
            question.condition = condition;
          }
        });
        question.answer_options = [];
        answerOptionsResult.forEach(function (answerOption) {
          if (answerOption.question_id === question.id) {
            answerOptionsConditionsResult.forEach(function (condition) {
              if (answerOption.id === condition.condition_answer_option_id) {
                answerOption.condition = condition;
              }
            });
            question.answer_options.push(answerOption);
          }
        });
      });
      return returnObject;
    });
  }

  async function hasAnswersNotifyFeature(questionnaireInstanceId) {
    const ret = await db.oneOrNone(
      'SELECT questionnaire_instances.id as id  FROM questionnaire_instances, studies ' +
        'WHERE questionnaire_instances.id=$1 AND questionnaire_instances.study_id=studies.name AND ' +
        'studies.has_answers_notify_feature=true',
      [questionnaireInstanceId]
    );
    return ret && ret.id ? true : false;
  }

  async function hasAnswersNotifyFeatureByMail(questionnaireInstanceId) {
    const ret = await db.oneOrNone(
      'SELECT questionnaire_instances.id as id FROM questionnaire_instances, studies ' +
        'WHERE questionnaire_instances.id=$1 AND questionnaire_instances.study_id=studies.name AND ' +
        'studies.has_answers_notify_feature_by_mail=true',
      [questionnaireInstanceId]
    );
    return ret && ret.id ? true : false;
  }

  async function isNotableAnswer(answerOptionId, answerValue) {
    const ret = await db.oneOrNone(
      'SELECT is_notable, values FROM answer_options ' +
        'WHERE answer_options.id=$1',
      [answerOptionId]
    );
    answerValue = answerValue.split(';');
    if (ret) {
      const values = ret.values;
      const is_notable = ret.is_notable;
      for (let i = 0; i < values.length; i++) {
        if (answerValue.includes(values[i])) {
          return is_notable[i];
        }
      }
    }
    return false;
  }

  async function insertContactProbandRecordForNotableAnswer(
    questionnaireInstanceId
  ) {
    const retUserId = await db.one(
      'SELECT user_id FROM questionnaire_instances ' + 'WHERE id=$1',
      [questionnaireInstanceId]
    );
    const userId = retUserId.user_id;
    const retCheckExists = await db.oneOrNone(
      'SELECT id FROM users_to_contact ' +
        'WHERE user_id=$1 AND now()::timestamp::date=created_at::timestamp::date',
      [userId]
    );
    // Insert a new record only on every new day, otherwise updates the record
    if (!retCheckExists || !retCheckExists.id) {
      return await db.oneOrNone(
        'INSERT INTO users_to_contact (user_id, notable_answer_questionnaire_instances, is_notable_answer, ' +
          'is_notable_answer_at ,processed) ' +
          'VALUES ($1, $2, $3, to_timestamp($4), $5)',
        [userId, [questionnaireInstanceId], true, Date.now() / 1000.0, false]
      );
    } else {
      return await db.oneOrNone(
        'UPDATE users_to_contact SET is_notable_answer=$1, is_notable_answer_at=to_timestamp($2)' +
          ', processed=$3, notable_answer_questionnaire_instances=array_append(notable_answer_questionnaire_instances,$4) ' +
          'WHERE id=$5 AND NOT ($4=ANY(notable_answer_questionnaire_instances))',
        [
          true,
          Date.now() / 1000.0,
          false,
          questionnaireInstanceId,
          retCheckExists.id,
        ]
      );
    }
  }

  async function getPMEmailOfQuestionnaireInstance(questionnaireInstanceId) {
    const email = await db.oneOrNone(
      'SELECT studies.pm_email as email  FROM questionnaire_instances, studies ' +
        'WHERE questionnaire_instances.id=$1 AND questionnaire_instances.study_id=studies.name',
      [questionnaireInstanceId]
    );
    return email;
  }

  async function getQuestionnaireInstanceAnswers(questionnaireInstanceId) {
    const email = await db.manyOrNone(
      'SELECT * FROM answers ' + 'WHERE questionnaire_instance_id=$1',
      [questionnaireInstanceId]
    );
    return email;
  }

  async function getNotFilledoutQuestionnaireInstanceIds() {
    const ids = [];
    const query =
      'SELECT questionnaire_instances.id AS id, questionnaire_instances.date_of_issue AS date_of_issue, ' +
      'questionnaires.notify_when_not_filled_time as notify_when_not_filled_time, questionnaires.notify_when_not_filled_day as notify_when_not_filled_day ' +
      'FROM questionnaire_instances, questionnaires ' +
      "WHERE (questionnaire_instances.status = 'in_progress' OR questionnaire_instances.status = 'active' OR questionnaire_instances.status = 'expired') " +
      'AND questionnaires.notify_when_not_filled=true AND questionnaire_instances.questionnaire_id=questionnaires.id ' +
      'AND NOT EXISTS (SELECT id FROM users_to_contact WHERE questionnaire_instances.id=ANY(users_to_contact.not_filledout_questionnaire_instances) ' +
      'AND now()::timestamp::date=users_to_contact.created_at::timestamp::date)';
    const ret = await db.manyOrNone(query);
    if (ret && ret.length > 0) {
      for (let i = 0; i < ret.length; i++) {
        const id = ret[i].id;

        if (!ret[i].notify_when_not_filled_time) {
          ret[i].notify_when_not_filled_time = defaultEmailNotificationTime;
        }

        if (!ret[i].notify_when_not_filled_day) {
          ret[i].notify_when_not_filled_day = defaultEmailNotificationDay;
        }

        const time = ret[i].notify_when_not_filled_time.split(':');
        const day = ret[i].notify_when_not_filled_day;
        const issueDate = ret[i].date_of_issue;
        const notificationDate = new Date(issueDate);
        notificationDate.setHours(time[0], time[1], 0);
        notificationDate.setDate(notificationDate.getDate() + day);
        if (Date.now() > notificationDate.getTime()) {
          ids.push(id);
        }
      }
    }
    return ids;
  }

  async function insertContactProbandRecordForNotAnswered(data) {
    const retUserId = await db.one(
      'SELECT user_id FROM questionnaire_instances ' + 'WHERE id=$1',
      [data.questionnaireInstanceId]
    );
    const userId = retUserId.user_id;
    const retCheckExists = await db.oneOrNone(
      'SELECT id FROM users_to_contact ' +
        'WHERE user_id=$1 AND now()::timestamp::date=created_at::timestamp::date',
      [userId]
    );
    // Insert a new record only on every new day, otherwise updates the record
    if (!retCheckExists || !retCheckExists.id) {
      return await db.oneOrNone(
        'INSERT INTO users_to_contact (user_id, not_filledout_questionnaire_instances, is_not_filledout, ' +
          'is_not_filledout_at ,processed) ' +
          'VALUES ($1, $2, $3, to_timestamp($4), $5)',
        [
          userId,
          [data.questionnaireInstanceId],
          true,
          Date.now() / 1000.0,
          false,
        ]
      );
    } else {
      // Remove questionnaireInstanceId duplicates
      return await db.oneOrNone(
        'UPDATE users_to_contact SET is_not_filledout=$1, is_not_filledout_at=to_timestamp($2)' +
          ', processed=$3, not_filledout_questionnaire_instances=array_append(not_filledout_questionnaire_instances,$4) ' +
          'WHERE id=$5 AND NOT ($4=ANY(not_filledout_questionnaire_instances))',
        [
          true,
          Date.now() / 1000.0,
          false,
          data.questionnaireInstanceId,
          retCheckExists.id,
        ]
      );
    }
  }

  async function getDailyAggregatorEmailStats() {
    const stats = new Map();
    const activeStudiesWithNotifByEmail = await db.manyOrNone(
      'SELECT name,pm_email FROM studies ' +
        "WHERE has_answers_notify_feature_by_mail=true AND status='active'"
    );

    if (
      activeStudiesWithNotifByEmail &&
      activeStudiesWithNotifByEmail.length > 0
    ) {
      activeStudiesWithNotifByEmail.forEach((value) => {
        stats.set(value.name, {
          questionnairesWithNotableAnswersNum: 0,
          notFinishedQuestionnairesNum: 0,
          email: value.pm_email,
        });
      });
    } else {
      return stats;
    }
    const res1 = await db.manyOrNone(
      'SELECT COUNT(DISTINCT u.user_id), s.name FROM studies AS s,questionnaire_instances AS q, users_to_contact as u \n' +
        "WHERE q.id=ANY(u.notable_answer_questionnaire_instances) AND (u.created_at>=NOW() - INTERVAL '24 HOURS') \n" +
        "AND s.has_answers_notify_feature_by_mail=true AND s.status='active' \n" +
        'AND q.study_id=s.name \n' +
        'GROUP BY s.name\n'
    );

    if (res1 && res1.length > 0) {
      for (let i = 0; i < res1.length; i++) {
        stats.get(res1[i].name).questionnairesWithNotableAnswersNum =
          res1[i].count;
      }
    }
    const res2 = await db.manyOrNone(
      'SELECT COUNT(DISTINCT u.user_id), s.name FROM studies AS s,questionnaire_instances AS q, users_to_contact as u \n' +
        "WHERE q.id=ANY(u.not_filledout_questionnaire_instances) AND (u.created_at>=NOW() - INTERVAL '24 HOURS') \n" +
        "AND s.has_answers_notify_feature_by_mail=true AND s.status='active' \n" +
        'AND q.study_id=s.name \n' +
        'GROUP BY s.name\n'
    );

    if (res2 && res2.length > 0) {
      for (let i = 0; i < res2.length; i++) {
        stats.get(res2[i].name).notFinishedQuestionnairesNum = res2[i].count;
      }
    }
    return stats;
  }

  return {
    /**
     * @function
     * @description gets all questionnaire instances with status=active
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found questionnaire instances or empty array response if it does not exist
     */
    getActiveQuestionnaireInstances: getActiveQuestionnaireInstances,

    /**
     * @function
     * @description counts the number of all non spontaneous QI of a proband with status=active or in_progress
     * @memberof module:postgresqlHelper
     * @param {string} username Name of the proband
     * @returns {Promise} a resolved promise with the found questionnaire instances or empty array response if it does not exist
     */
    countOpenQuestionnaireInstances: countOpenQuestionnaireInstances,

    /**
     * @function
     * @description gets the questionnaire instance with the specified id
     * @memberof module:postgresqlHelper
     * @param {number} id the id of the questionnaire instance to get
     * @returns {Promise} a resolved promise with the found questionnaire instance rejected promise otherwise
     */
    getQuestionnaireInstance: getQuestionnaireInstance,

    /**
     * @function
     * @description gets the notification settings of a user
     * @memberof module:postgresqlHelper
     * @param {string} user_id the id of the user to get settings for
     * @returns {Promise} a resolved promise with the found settings or rejected promise otherwise
     */
    getUserNotificationSettings: getUserNotificationSettings,

    /**
     * @function
     * @description gets the notification settings of a questionnaire
     * @memberof module:postgresqlHelper
     * @param {number} questionnaire_id the id of the questionnaire to get settings for
     * @returns {Promise} a resolved promise with the found settings or rejected promise otherwise
     */
    getQuestionnaireNotificationSettings: getQuestionnaireNotificationSettings,

    /**
     * @function
     * @description gets the fcm token of the specified user
     * @memberof module:postgresqlHelper
     * @param {string} user_id the name of the user to get the token for
     * @returns {Promise} a resolved promise with the found token and device type or rejected promise otherwise
     */
    getTokenAndDeviceForUser: getTokenAndDeviceForUser,

    /**
     * @function
     * @description updates the specified users fcm token
     * @memberof module:postgresqlHelper
     * @param {string} user_id the name of the user to get the token for
     * @param {string} token the new token
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    updateFCMToken: updateFCMToken,

    /**
     * @function
     * @description gets the requested fcm_token if the user is allowed to
     * @memberof module:postgresqlHelper
     * @param {string} requester the requesting user
     * @param {string} username the requested user
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getTokenAndDeviceForUserIfAllowed: getTokenAndDeviceForUserIfAllowed,

    /**
     * @function
     * @description gets all studies with set pm email
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getStudiesWithPMEmail: getStudiesWithPMEmail,

    /**
     * @function
     * @description gets all studies with set hub email
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getStudiesWithHUBEmail: getStudiesWithHUBEmail,

    /**
     * @function
     * @description gets all samples for a study that were sampled yesterday
     * @memberof module:postgresqlHelper
     * @param {string} study_id the study to get samples for
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getNewSampledSamplesForStudy: getNewSampledSamplesForStudy,

    /**
     * @function
     * @description gets all samples for a study that were analyzed yesterday
     * @memberof module:postgresqlHelper
     * @param {string} study_id the study to get samples for
     * @returns {Promise} a resolved promise with the found studies or a rejected promise with the error
     */
    getNewAnalyzedSamplesForStudy: getNewAnalyzedSamplesForStudy,

    /**
     * @function
     * @description updates the questionnaire instance to having been scheduled
     * @memberof module:postgresqlHelper
     * @param {number} id the instance id to update
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    markInstanceAsScheduled: markInstanceAsScheduled,

    /**
     * @function
     * @description inserts a notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} schedule the schedule to insert
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    insertNotificationSchedule: insertNotificationSchedule,

    /**
     * @function
     * @description inserts a custom notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} schedule the schedule to insert
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    insertCustomNotificationSchedule: insertCustomNotificationSchedule,

    /**
     * @function
     * @description gets all scheduled notifications from the past
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getAllDueNotifications: getAllDueNotifications,

    /**
     * @function
     * @description gets the notification schedule for the user
     * @memberof module:postgresqlHelper
     * @param {number} user_id the users id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getAllNotificationsForUser: getAllNotificationsForUser,

    /**
     * @function
     * @description gets the notification schedule for given Id
     * @memberof module:postgresqlHelper
     * @param {number} id the schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getNotificationById: getNotificationById,

    /**
     * @function
     * @description updates the date of the notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @param {number} date the new date
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    updateTimeForNotification: updateTimeForNotification,

    /**
     * @function
     * @description deletes the notification schedule
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    deleteScheduledNotification: deleteScheduledNotification,

    /**
     * @function
     * @description deletes the notification schedules associated with the instance
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule instance id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    deleteScheduledNotificationByInstanceId:
      deleteScheduledNotificationByInstanceId,

    /**
     * @function
     * @description postpones the notification schedules associated with the instance by 1 day
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule instance id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    postponeNotificationByInstanceId: postponeNotificationByInstanceId,

    /**
     * @function
     * @description postpones the notification schedule with id
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    postponeNotification: postponeNotification,

    /**
     * @function
     * @description postpones the notification schedule with id
     * @memberof module:postgresqlHelper
     * @param {number} id the notification schedule id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    postponeNotificationByOneHour: postponeNotificationByOneHour,

    /**
     * @function
     * @description gets the labresult
     * @memberof module:postgresqlHelper
     * @param {number} id the labresult id
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getLabResult: getLabResult,

    /**
     * @function
     * @description gets the questionnaire filtered for all unmet conditions
     * @memberof module:postgresqlHelper
     * @param {object} qInstance the qInstance to get questionnaire for
     * @returns {Promise} a resolved promise in case of success or a rejected promise otherwise
     */
    getFilteredQuestionnaireForInstance: getFilteredQuestionnaireForInstance,

    /**
     * @function
     * @description check if the notification feature enable for the given study
     * @memberof module:postgresqlHelper
     * @param {number} questionnaireInstanceId the id the of questionnaire instance
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    hasAnswersNotifyFeature: hasAnswersNotifyFeature,

    /**
     * @function
     * @description check if the notification feature enable for the given study
     * @memberof module:postgresqlHelper
     * @param {number} questionnaireInstanceId the id the of questionnaire instance
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    hasAnswersNotifyFeatureByMail: hasAnswersNotifyFeatureByMail,

    /**
     * @function
     * @description checks if given answer should be notified upon
     * @memberof module:postgresqlHelper
     * @param {number} answerOptionId the id of the answer option
     * @param {string} answerValue the value of the answer
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    isNotableAnswer: isNotableAnswer,

    /**
     * @function
     * @description inserts a new proband to contact record in db
     * @memberof module:postgresqlHelper
     * @param {questionnaireInstanceId} the questionnaire instance id
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    insertContactProbandRecordForNotableAnswer:
      insertContactProbandRecordForNotableAnswer,

    /**
     * @function
     * @description gets the email address of the proband manager based on questionnaire instance
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    getPMEmailOfQuestionnaireInstance: getPMEmailOfQuestionnaireInstance,

    /**
     * @function
     * @description gets a list of the given questionnaire instance answers
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    getQuestionnaireInstanceAnswers: getQuestionnaireInstanceAnswers,

    /**
     * @function
     * @description gets questionnaire instancs that are yet to be fully answered
     * @memberof module:postgresqlHelper
     * @param {array} list of questionnaire instance IDs
     * @returns {Promise} a resolved promise with the found results or a rejected promise with the error
     */
    getNotFilledoutQuestionnaireInstanceIds:
      getNotFilledoutQuestionnaireInstanceIds,

    /**
     * @function
     * @description inserts a new proband to contact record in db
     * @memberof module:postgresqlHelper
     * @param {object} the new record data
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    insertContactProbandRecordForNotAnswered:
      insertContactProbandRecordForNotAnswered,

    /**
     * @function
     * @description retrieves statistical aggregation for all active studies
     * @memberof module:postgresqlHelper
     * @returns {Promise} a resolved promise with the results or a rejected promise with the error
     */
    getDailyAggregatorEmailStats: getDailyAggregatorEmailStats,
  };
})();

module.exports = postgresqlHelper;
