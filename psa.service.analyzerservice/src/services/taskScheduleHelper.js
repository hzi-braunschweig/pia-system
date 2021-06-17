const schedule = require('node-schedule');

const questionnaireInstancesService = require('./questionnaireInstancesService.js');

/**
 * @description task scheduler and task functions
 */
const taskScheduleHelper = (function () {
  function scheduleQuestionnaireInstancesActivator(db) {
    // Once every hour, add 5 min to catch instances at the full hour
    const rule = new schedule.RecurrenceRule();
    rule.minute = 5;

    return schedule.scheduleJob(rule, function () {
      questionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus(
        db
      );
    });
  }

  return {
    /**
     * @function
     * @description schedules the activation of questionnaire instances task
     * @memberof module:taskScheduleHelper
     * @param {Object} db the connected postgresql db object
     */
    scheduleQuestionnaireInstancesActivator:
      scheduleQuestionnaireInstancesActivator,
  };
})();

module.exports = taskScheduleHelper;
