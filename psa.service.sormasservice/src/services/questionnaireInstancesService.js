const mapperService = require('./mapperService');
const sormasClient = require('../clients/sormasClient');
const expiredUsersDeletionService = require('./expiredUsersDeletionService');
const sleep = require('util').promisify(setTimeout);

/**
 * @description check and upload questionnaire instances
 */
const questionnaireInstancesService = (function () {
  async function checkAndUploadQuestionnaireInstances(db) {
    console.log(
      'questionnaireInstancesService: checkAndUploadQuestionnaireInstances'
    );
    console.log(
      'questionnaireInstancesService: getting sure SORMAS is available...'
    );

    try {
      await waitForSormas();
    } catch (e) {
      console.error(e);
      return;
    }

    console.log('questionnaireInstancesService: SORMAS is now available');
    const qis1 = await db.manyOrNone(
      'SELECT * FROM questionnaire_instances WHERE (transmission_ts_v1 IS NULL AND date_of_release_v1 IS NOT NULL)'
    );
    await Promise.all(
      qis1.map((qi) => uploadSingleQuestionnaireInstance(db, qi, 1))
    );
    const qis2 = await db.manyOrNone(
      'SELECT * FROM questionnaire_instances WHERE (transmission_ts_v2 IS NULL AND date_of_release_v2 IS NOT NULL)'
    );
    await Promise.all(
      qis2.map((qi) => uploadSingleQuestionnaireInstance(db, qi, 2))
    );
  }

  async function waitForSormas(retryCount = 24, delay = 5000) {
    if (retryCount <= 0) {
      throw new Error(
        'questionnaireInstancesService: Could not reach SORMAS after multiple retries'
      );
    }
    if ((await sormasClient.getApiVersion()) === null) {
      await sleep(delay);
      return await waitForSormas(--retryCount);
    }
  }

  async function uploadSingleQuestionnaireInstance(db, qi, version) {
    console.log(`uploadSingleQuestionnaireInstance: ${qi.id}, v${version}`);
    const rawPiaData = await db.manyOrNone(
      "SELECT value, values, values_code, label FROM answers a LEFT JOIN answer_options ao ON a.answer_option_id = ao.id WHERE a.value IS NOT NULL AND value != '' AND ao.label IS NOT NULL and ao.label != '' AND a.questionnaire_instance_id = $1 AND versioning = $2",
      [qi.id, version]
    );
    const resolvedPiaData = {};
    rawPiaData.forEach((piaData) => {
      if (!piaData.values.length) {
        // Nothing to resolve, keep as is; e.g. numeric values
        resolvedPiaData[piaData.label] = piaData.value;
      } else {
        // Something to resolve value into code...
        const codeIndex = piaData.values.indexOf(piaData.value);
        if (codeIndex >= 0) {
          // Note: If not, our database is corrupt, but check anyway
          resolvedPiaData[piaData.label] = piaData.values_code[codeIndex];
        }
      }
    });
    const sormasData = mapperService.mapPiaToSormas(resolvedPiaData);
    if (!Object.keys(sormasData).length) {
      console.log('QuestionnaireInstance has no relevant data: ' + qi.id);
      await markQIasTransmitted(db, qi, version);
      return;
    }
    const userData = await db.one(
      'SELECT username, ids FROM USERS WHERE username = $1',
      qi.user_id
    );
    if (!userData.ids) {
      console.log(
        "QuestionnaireInstance's answering user is not registered with UUID: " +
          qi.id
      );
      return;
    }
    await sormasClient
      .uploadVisit(userData.ids, qi.date_of_issue, version, sormasData)
      .then(async () => await markQIasTransmitted(db, qi, version))
      .then(
        async () =>
          await expiredUsersDeletionService.checkAndDeleteSingleUser(
            qi.user_id,
            db
          )
      )
      .catch((err) => console.log(err));
  }

  async function markQIasTransmitted(db, qi, version) {
    switch (version) {
      case 1:
        await db.none(
          'UPDATE questionnaire_instances SET transmission_ts_v1 = $1 WHERE id = $2',
          [new Date(), qi.id]
        );
        break;
      case 2:
        await db.none(
          'UPDATE questionnaire_instances SET transmission_ts_v2 = $1 WHERE id = $2',
          [new Date(), qi.id]
        );
        break;
      default:
        throw new Error('Invalid version.');
    }
  }

  return {
    /**
     * @function
     * @description upload outstanding questionnaire instances to SORMAS
     * @memberof module:questionnaireInstancesService
     * @param {Object} db the connected postgresql db object
     */
    checkAndUploadQuestionnaireInstances: checkAndUploadQuestionnaireInstances,

    /**
     * @function
     * @description upload questionnaire instance to SORMAS
     * @memberof module:questionnaireInstancesService
     * @param {Object} db the connected postgresql db object
     * @param {Object} qi the questionnaire instance object
     * @param {Integer} version the qi's version, 1 or 2
     */
    uploadSingleQuestionnaireInstance: uploadSingleQuestionnaireInstance,
  };
})();

module.exports = questionnaireInstancesService;
