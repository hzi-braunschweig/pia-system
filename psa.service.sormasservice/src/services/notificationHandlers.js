const { config } = require('../config');

const questionnaireInstancesService = require('./questionnaireInstancesService.js');

/**
 * @description handler methods that handle db notifications
 */
const notificationHandlers = (function () {
  async function handleUpdatedInstance(db, instance_old, instance_new) {
    if (config.isTesting) return;
    if (instance_new.date_of_release_v1 && !instance_new.transmission_ts_v1) {
      questionnaireInstancesService.uploadSingleQuestionnaireInstance(
        db,
        instance_new,
        1
      );
    }
    if (instance_new.date_of_release_v2 && !instance_new.transmission_ts_v2) {
      questionnaireInstancesService.uploadSingleQuestionnaireInstance(
        db,
        instance_new,
        2
      );
    }
  }

  return {
    /**
     * @function
     * @description checks updated questionnaire instance and might upload to SORMAS
     * @memberof module:notificationHandlers
     * @param {Object} db the connected postgresql db object
     * @param {Object} answer the inserted answer
     */
    handleUpdatedInstance: handleUpdatedInstance,
  };
})();

module.exports = notificationHandlers;
