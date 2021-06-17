const schedule = require('node-schedule');

const questionnaireInstancesService = require('./questionnaireInstancesService.js');
const expiredUsersDeletionService = require('./expiredUsersDeletionService');

/**
 * @description task scheduler and task functions
 */
const taskScheduleHelper = (function () {
  function scheduleQuestionnaireInstancesUploader(db) {
    // Once a day at 1 am
    const rule = new schedule.RecurrenceRule();
    rule.hour = 1;
    rule.minute = 0;

    return schedule.scheduleJob(
      rule,
      async function (theDb) {
        await questionnaireInstancesService.checkAndUploadQuestionnaireInstances(
          theDb
        );
        expiredUsersDeletionService.checkAndDeleteExpiredUsers(theDb);
      }.bind(null, db)
    );
  }

  return {
    /**
     * @function
     * @description schedules the activation of questionnaire instances upload task
     * @memberof module:taskScheduleHelper
     * @param {Object} db the connected postgresql db object
     */
    scheduleQuestionnaireInstancesUploader:
      scheduleQuestionnaireInstancesUploader,
  };
})();

module.exports = taskScheduleHelper;
