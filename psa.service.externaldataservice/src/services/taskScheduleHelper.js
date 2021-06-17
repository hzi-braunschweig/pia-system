const schedule = require('node-schedule');

const modysImportService = require('./modysImportService');

class TaskScheduleHelper {
  static scheduleUpdatesFromModys() {
    // Once a day at 10 pm
    const rule = new schedule.RecurrenceRule();
    rule.hour = 22;
    rule.minute = 0;

    return schedule.scheduleJob(rule, () => {
      modysImportService.updatePersonalData();
    });
  }
}

module.exports = TaskScheduleHelper;
