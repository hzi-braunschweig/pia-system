const schedule = require('node-schedule');
const postgresqlHelper = require('./postgresqlHelper.js');

/**
 * @description task scheduler and task functions
 */
const passwordDeletionTask = (function () {
  function schedulePasswordDeletion() {
    // Once every hour at 30 minutes
    const passwordValidityPeriod = 48; // in hours
    const rule = new schedule.RecurrenceRule();
    rule.minute = 30;

    return schedule.scheduleJob(
      rule,
      function () {
        postgresqlHelper.deleteAllDuePasswords(passwordValidityPeriod);
      }.bind(null)
    );
  }

  return {
    /**
     * @function
     * @description schedules the deletion of all passwords after a specified number of hours
     * @memberof module:passwordDeletionTask
     */
    schedulePasswordDeletion: schedulePasswordDeletion,
  };
})();

module.exports = passwordDeletionTask;
