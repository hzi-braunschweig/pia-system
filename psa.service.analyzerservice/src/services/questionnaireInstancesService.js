require('datejs');

const sormasEndDateService = require('../services/sormasEndDateService');

/**
 * @description check and create questionnaire instances
 */
const questionnaireInstancesService = (function () {
  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  async function checkAndUpdateQuestionnaireInstancesStatus(db) {
    console.log(
      new Date().toString('dd.MM.yyyy HH:mm') +
        ' - Checking Questionnaire Instances...'
    );
    const csQuestionnaireInstances = new db.$config.pgp.helpers.ColumnSet(
      ['?id', 'status'],
      { table: 'questionnaire_instances' }
    );
    const csAnswers = new db.$config.pgp.helpers.ColumnSet(
      [
        'questionnaire_instance_id',
        'question_id',
        'answer_option_id',
        'versioning',
        'value',
      ],
      { table: 'answers' }
    );

    await db.tx(async function (t) {
      const qInstances = await t.manyOrNone(`
                SELECT qi.id,
                       qi.date_of_issue,
                       qi.status,
                       qi.date_of_release_v1,
                       qi.user_id,
                       questionnaires.cycle_unit,
                       questionnaires.expires_after_days,
                       questionnaires.finalises_after_days,
                       questionnaires.type,
                       users.ids
                FROM questionnaire_instances as qi
                         JOIN questionnaires
                              ON qi.questionnaire_id = questionnaires.id AND
                                 qi.questionnaire_version = questionnaires.version
                         JOIN users ON qi.user_id = users.username
                WHERE (status = 'inactive' OR status = 'active' OR status = 'in_progress' OR
                       status = 'released_once')`);
      const vQuestionnaireInstances = [];
      const instanceIdsToExpire = [];
      const instanceIdsToReleaseTwice = [];
      let deletedQueues = [];
      let deletedSchedules = [];
      if (
        qInstances !== null &&
        qInstances !== undefined &&
        qInstances.length > 0
      ) {
        const curDate = new Date();
        await asyncForEach(qInstances, async (qInstance) => {
          // Expire instance
          if (
            (qInstance.status === 'inactive' ||
              qInstance.status === 'active' ||
              qInstance.status === 'in_progress') &&
            (await isExpired(
              qInstance,
              qInstance.expires_after_days,
              curDate
            )) &&
            qInstance.cycle_unit !== 'spontan' &&
            qInstance.type === 'for_probands'
          ) {
            vQuestionnaireInstances.push({
              id: qInstance.id,
              status: 'expired',
            });
            instanceIdsToExpire.push(qInstance.id);
          }
          // Activate instance
          else if (
            qInstance.status === 'inactive' &&
            qInstance.date_of_issue <= curDate
          ) {
            vQuestionnaireInstances.push({
              id: qInstance.id,
              status: 'active',
            });
          }

          // Release instance twice
          else if (
            qInstance.status === 'released_once' &&
            new Date(qInstance.date_of_release_v1).addDays(
              qInstance.finalises_after_days
            ) < curDate
          ) {
            instanceIdsToReleaseTwice.push(qInstance.id);
          }
        });
        if (instanceIdsToReleaseTwice.length > 0) {
          await t.none(
            'UPDATE questionnaire_instances SET date_of_release_v2 = date_of_release_v1, status=$1 WHERE id IN($2:csv)',
            ['released_twice', instanceIdsToReleaseTwice]
          );
          const v1Answers = await t.manyOrNone(
            'SELECT questionnaire_instance_id, question_id, answer_option_id, 2 versioning, value FROM answers WHERE questionnaire_instance_id IN($1:csv) AND versioning=1',
            [instanceIdsToReleaseTwice]
          );
          await t.none(
            'DELETE FROM answers WHERE questionnaire_instance_id IN($1:csv) AND versioning=2',
            [instanceIdsToReleaseTwice]
          );
          if (v1Answers.length > 0) {
            const qAnswers = db.$config.pgp.helpers.insert(
              v1Answers,
              csAnswers
            );
            await t.none(qAnswers);
            console.log(
              new Date().toString('dd.MM.yyyy HH:mm') +
                ' - Copied ' +
                v1Answers.length +
                ' answers as version 2 for ' +
                instanceIdsToReleaseTwice.length +
                ' questionnaire instances that are finalized'
            );
          }
        }
        if (vQuestionnaireInstances.length > 0) {
          const qUpdateQuestionnaireInstances =
            db.$config.pgp.helpers.update(
              vQuestionnaireInstances,
              csQuestionnaireInstances
            ) + 'WHERE v.id = t.id RETURNING *';
          await t.many(qUpdateQuestionnaireInstances);
        }
        if (instanceIdsToExpire.length > 0) {
          deletedQueues = await t.manyOrNone(
            'DELETE FROM questionnaire_instances_queued WHERE questionnaire_instance_id IN($1:csv) RETURNING *',
            [instanceIdsToExpire]
          );
          deletedSchedules = await t.manyOrNone(
            'DELETE FROM notification_schedules WHERE notification_type=$1 AND reference_id::integer IN($2:csv) RETURNING *',
            ['qReminder', instanceIdsToExpire]
          );
        }
      }
      console.log(
        new Date().toString('dd.MM.yyyy HH:mm') +
          ' - Deleted ' +
          deletedQueues.length +
          ' Queues and ' +
          deletedSchedules.length +
          ' schedules for expired instances'
      );
      console.log(
        new Date().toString('dd.MM.yyyy HH:mm') +
          ' - Activated or expired ' +
          vQuestionnaireInstances.length +
          ' Questionnaire Instances!'
      );
    });
  }

  async function createNextQuestionnaireInstance(questionnaire, instance) {
    const newQInstance = {
      study_id: instance.study_id,
      questionnaire_id: instance.questionnaire_id,
      questionnaire_version: instance.questionnaire_version,
      questionnaire_name: instance.questionnaire_name,
      user_id: instance.user_id,
      date_of_issue: null,
      cycle: instance.cycle + 1,
    };
    const newIssueDate = new Date(instance.date_of_issue);
    const oldIssueDate = new Date(instance.date_of_issue);

    const cycle_per_day = questionnaire.cycle_per_day;
    const cycle_first_hour = questionnaire.cycle_first_hour
      ? questionnaire.cycle_first_hour
      : 0;
    const cycle_amount = questionnaire.cycle_amount;

    if (questionnaire.cycle_unit === 'spontan') {
      newQInstance.date_of_issue = Date.today();
    } else if (questionnaire.cycle_unit === 'hour') {
      if (
        isDayLimitReached(
          newIssueDate.getHours(),
          cycle_per_day,
          cycle_first_hour,
          cycle_amount
        )
      ) {
        newQInstance.date_of_issue = newIssueDate.add(1).days();
      } else {
        newQInstance.date_of_issue = newIssueDate.add(cycle_amount).hours();
      }

      // If new day, set hour to cycle_first_hour
      if (
        newQInstance.date_of_issue.getDate() !== oldIssueDate.getDate() &&
        // Prevent infinite loops when cycle_first_hour is negative
        (cycle_first_hour > 0 ||
          24 - oldIssueDate.getHours() !== -cycle_first_hour)
      ) {
        newQInstance.date_of_issue.setHours(0, 0, 0, 0);
        newQInstance.date_of_issue = newQInstance.date_of_issue
          .add(cycle_first_hour)
          .hours();
      }
    } else if (questionnaire.cycle_unit === 'day') {
      newQInstance.date_of_issue = newIssueDate.add(cycle_amount).days();
    } else if (questionnaire.cycle_unit === 'week') {
      newQInstance.date_of_issue = newIssueDate.add(cycle_amount).weeks();
    } else if (questionnaire.cycle_unit === 'month') {
      newIssueDate.add(cycle_amount).months();
      if (questionnaire.notification_weekday) {
        const dayNo = Date.getDayNumberFromName(
          questionnaire.notification_weekday
        );
        if (newIssueDate.getDay() !== dayNo) {
          newIssueDate.moveToDayOfWeek(dayNo);
        }
      }
      newQInstance.date_of_issue = newIssueDate;
    }

    const curDate = new Date();
    if (newQInstance.date_of_issue <= curDate) {
      if (
        (await isExpired(
          newQInstance,
          questionnaire.expires_after_days,
          curDate
        )) &&
        questionnaire.cycle_unit !== 'spontan' &&
        questionnaire.type === 'for_probands'
      ) {
        newQInstance.status = 'expired';
      } else {
        newQInstance.status = 'active';
      }
    } else {
      newQInstance.status = 'inactive';
    }
    return newQInstance;
  }

  function isDayLimitReached(
    curHour,
    cycle_per_day,
    cycle_first_hour,
    cycle_amount
  ) {
    return (curHour - cycle_first_hour) / cycle_amount + 1 >= cycle_per_day;
  }

  async function createQuestionnaireInstances(
    questionnaire,
    user,
    hasInternalCondition,
    onlyLoginDependantOnes = false
  ) {
    if (
      questionnaire === null ||
      questionnaire === undefined ||
      user === null ||
      user === undefined
    ) {
      return [];
    }

    const issueDates = getDatesForQuestionnaireInstances(
      questionnaire,
      user,
      hasInternalCondition,
      onlyLoginDependantOnes
    );
    const qInstances = [];
    let i = 1;
    await asyncForEach(issueDates, async function (issueDate) {
      const newQInstance = {
        study_id: questionnaire.study_id,
        questionnaire_id: questionnaire.id,
        questionnaire_version: questionnaire.version,
        questionnaire_name: questionnaire.name,
        user_id: user.username,
        date_of_issue: issueDate,
        cycle: i,
      };

      const curDate = new Date();
      if (issueDate <= curDate) {
        if (
          (await isExpired(
            newQInstance,
            questionnaire.expires_after_days,
            curDate
          )) &&
          questionnaire.cycle_unit !== 'spontan' &&
          questionnaire.type === 'for_probands'
        ) {
          newQInstance.status = 'expired';
        } else {
          newQInstance.status = 'active';
        }
      } else {
        newQInstance.status = 'inactive';
      }
      qInstances.push(newQInstance);

      i++;
    });

    return qInstances;
  }

  function getDatesForQuestionnaireInstances(
    questionnaire,
    user,
    hasInternalCondition,
    onlyLoginDependantOnes
  ) {
    if (
      questionnaire === null ||
      questionnaire === undefined ||
      user === null ||
      user === undefined ||
      (user.first_logged_in_at === null &&
        questionnaire.cycle_unit !== 'date' &&
        questionnaire.type !== 'for_research_team') ||
      (onlyLoginDependantOnes &&
        (questionnaire.cycle_unit === 'date' ||
          questionnaire.type === 'for_research_team'))
    ) {
      return [];
    }

    const offsetDays = questionnaire.activate_after_days;
    const durationDays = questionnaire.deactivate_after_days;
    const cycle_amount = questionnaire.cycle_amount;
    const cycle_unit = questionnaire.cycle_unit;
    const cycle_per_day = questionnaire.cycle_per_day
      ? questionnaire.cycle_per_day
      : 24;
    const cycle_first_hour = questionnaire.cycle_first_hour
      ? questionnaire.cycle_first_hour
      : 0;
    const notification_weekday = questionnaire.notification_weekday;
    const userSettingsHour = user.notification_time
      ? parseInt(user.notification_time.split(':')[0], 10)
      : 0;
    const activate_at_date = questionnaire.activate_at_date;
    const datesResult = [];

    let startDate = new Date(
      cycle_unit === 'date'
        ? activate_at_date
        : questionnaire.type === 'for_research_team'
        ? new Date(questionnaire.created_at)
        : Math.max(
            new Date(user.first_logged_in_at),
            new Date(questionnaire.created_at)
          )
    );
    // Set the hour of the QI to the hour configured in questionnaire or as configured by proband
    startDate.setHours(0, 0, 0, 0);
    if (cycle_unit !== 'spontan') {
      startDate = startDate
        .add(cycle_unit === 'hour' ? cycle_first_hour : userSettingsHour)
        .hours();
    }

    if (
      cycle_unit === 'once' ||
      hasInternalCondition ||
      cycle_amount < 1 ||
      cycle_unit === 'date' ||
      cycle_unit === 'spontan'
    ) {
      const newDate =
        cycle_unit === 'date' ? startDate : addDays(startDate, offsetDays);
      // If a weekday for the notification is set, postpone the instance date to this weekday
      if (
        (cycle_unit === 'week' || cycle_unit === 'month') &&
        notification_weekday
      ) {
        const dayNo = Date.getDayNumberFromName(notification_weekday);
        if (newDate.getDay() !== dayNo) {
          newDate.moveToDayOfWeek(dayNo);
        }
      }

      datesResult.push(newDate);
    } else {
      let incrementFunc;
      if (cycle_unit === 'hour') {
        incrementFunc = addHours;
      } else if (cycle_unit === 'day') {
        incrementFunc = addDays;
      } else if (cycle_unit === 'week') {
        incrementFunc = addWeeks;
      } else if (cycle_unit === 'month') {
        incrementFunc = addMonths;
      }
      const max = addDays(startDate, offsetDays + durationDays);
      max.setHours(23, 59, 59, 0);
      let datesOnCurrentDay = 0;
      let lastDate = null;

      if (cycle_unit === 'month') {
        const offsetDate = addDays(startDate, offsetDays);
        let currentDate = offsetDate;
        let i = 0;
        while (currentDate < max) {
          const newDate = new Date(currentDate);
          // If a weekday for the notification is set, postpone the instance date to this weekday
          if (notification_weekday) {
            const dayNo = Date.getDayNumberFromName(notification_weekday);
            if (newDate.getDay() !== dayNo) {
              newDate.moveToDayOfWeek(dayNo);
            }
          }
          datesResult.push(newDate);
          lastDate = new Date(currentDate);

          i++;
          currentDate = incrementFunc(
            offsetDate,
            cycle_amount * i,
            cycle_first_hour,
            datesOnCurrentDay >= cycle_per_day
          );
        }
      } else {
        for (
          let i = addDays(startDate, offsetDays);
          i <= max;
          i = incrementFunc(
            i,
            cycle_amount,
            cycle_first_hour,
            datesOnCurrentDay >= cycle_per_day
          )
        ) {
          if (cycle_unit === 'hour') {
            const lastDayWithOffset = lastDate
              ? new Date(lastDate)
                  .add(cycle_first_hour < 0 ? -cycle_first_hour : 0)
                  .hours()
                  .getDate()
              : null;
            const curDayWithOffset = new Date(i)
              .add(cycle_first_hour < 0 ? -cycle_first_hour : 0)
              .hours()
              .getDate();
            if (!lastDate || lastDayWithOffset === curDayWithOffset) {
              datesOnCurrentDay++;
            } else {
              datesOnCurrentDay = 1;
            }
          }

          const newDate = new Date(i);
          // If a weekday for the notification is set, postpone the instance date to this weekday
          if (
            (cycle_unit === 'week' || cycle_unit === 'month') &&
            notification_weekday
          ) {
            const dayNo = Date.getDayNumberFromName(notification_weekday);
            if (newDate.getDay() !== dayNo) {
              newDate.moveToDayOfWeek(dayNo);
            }
          }
          datesResult.push(newDate);
          lastDate = new Date(i);
        }
      }
    }
    return datesResult;
  }

  function addHours(date, hours, cycle_first_hour, dayLimitReached) {
    const oldDate = new Date(date);
    let newDate = new Date(date);

    if (!dayLimitReached) {
      newDate = newDate.add(hours).hours();
    } else {
      newDate = newDate.add(1).days();
    }

    // Day changed, set time to cycle_first_hour
    if (
      oldDate.getDate() !== newDate.getDate() &&
      // Prevent infinite loop when cycle_first_hour is negative
      (cycle_first_hour > 0 || 24 - oldDate.getHours() !== -cycle_first_hour)
    ) {
      newDate.setHours(0, 0, 0, 0);
      newDate = newDate.add(cycle_first_hour).hours();
    }

    return newDate;
  }

  function addDays(date, days) {
    return new Date(date).add(days).days();
  }

  function addWeeks(date, weeks) {
    return new Date(date).add(weeks).weeks();
  }

  function addMonths(date, months) {
    return new Date(date).add(months).months();
  }

  function isConditionMet(answer, condition, type) {
    let answer_values = [];
    let condition_values;
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

  async function isExpired(qInstance, expires_after_days, curDate) {
    const sormasExpirationDate = await sormasEndDateService.getEndDateForUUID(
      qInstance.ids
    );
    const questionnaireExpirationDate = new Date(
      qInstance.date_of_issue
    ).addDays(expires_after_days);

    return (
      (sormasExpirationDate && sormasExpirationDate < curDate) ||
      questionnaireExpirationDate < curDate
    );
  }

  return {
    /**
     * @function
     * @description activates all questionnaire instances that have to be activated
     * @memberof module:questionnaireInstancesService
     * @param {Object} db the connected postgresql db object
     */
    checkAndUpdateQuestionnaireInstancesStatus:
      checkAndUpdateQuestionnaireInstancesStatus,

    /**
     * @function
     * @description creates questionnaire instances for the given (questionnaire,user) tuple
     * @memberof module:questionnaireInstancesService
     * @param {Object} questionnaire the questionnaire
     * @param {Object} user the user
     */
    createQuestionnaireInstances: createQuestionnaireInstances,

    /**
     * @function
     * @description creates the next questionnaire instance for the given questionnaire instance
     * @memberof module:questionnaireInstancesService
     * @param {Object} questionnaire the questionnaire
     * @param {Object} qInstance the last questionnaire instance
     */
    createNextQuestionnaireInstance: createNextQuestionnaireInstance,

    /**
     * @function
     * @description creates date objects for the given (questionnaire,user) tuple
     * @memberof module:questionnaireInstancesService
     * @param {Object} questionnaire the questionnaire
     * @param {Object} user the user
     */
    getDatesForQuestionnaireInstances: getDatesForQuestionnaireInstances,

    /**
     * @function
     * @description returns true if the value of answer meets the condition, false otherwise
     * @memberof module:questionnaireInstancesService
     * @param {Object} answer the answer object
     * @param {Object} condition the condition to check
     */
    isConditionMet: isConditionMet,

    /**
     * @function
     * @description returns true if either the sormas end date or the expiration date is reached
     * @memberof module:questionnaireInstancesService
     * @param qInstance {Object} QuestionnaireInstance
     * @param curDate {Date} the current date to check against
     */
    isExpired: isExpired,
  };
})();

module.exports = questionnaireInstancesService;
