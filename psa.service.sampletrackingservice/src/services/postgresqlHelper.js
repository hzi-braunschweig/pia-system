/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const { db } = require('../db');

/**
 * @description helper methods to access db
 */
const postgresqlHelper = (function () {
  async function getAllLabResultsForProband(user_id) {
    const labResults = await db.manyOrNone(
      "SELECT * FROM lab_results WHERE user_id=$1 AND study_status!='deleted'",
      [user_id]
    );
    return labResults;
  }

  async function getAllLabResultsByProband(user_id) {
    const labResults = await db.manyOrNone(
      'SELECT * FROM lab_results WHERE user_id=$1',
      [user_id]
    );
    return labResults;
  }

  async function getAllBloodSamplesForProband(user_id) {
    const bloodSamples = await db.manyOrNone(
      'SELECT * FROM blood_samples WHERE user_id=$1',
      [user_id]
    );
    return bloodSamples;
  }

  async function getLabResult(user_id, result_id) {
    const labResult = await db.oneOrNone(
      'SELECT * FROM lab_results WHERE user_id=$1 AND id = $2',
      [user_id, result_id]
    );
    if (labResult) {
      labResult.lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id = $1',
        [labResult.id]
      );
    }
    return labResult;
  }

  async function getLabResultForProband(user_id, result_id) {
    const labResult = await db.oneOrNone(
      'SELECT * FROM lab_results WHERE user_id=$1 AND id = $2 AND study_status!=$3',
      [user_id, result_id, 'deleted']
    );
    if (labResult) {
      labResult.lab_observations = await db.manyOrNone(
        'SELECT * FROM lab_observations WHERE lab_result_id = $1',
        [labResult.id]
      );
    }
    return labResult;
  }

  async function getLabResultById(sample_id) {
    return await db.oneOrNone('SELECT * FROM lab_results WHERE id = $1', [
      sample_id,
    ]);
  }

  async function getBloodSample(user_id, sample_id) {
    return await db.manyOrNone(
      'SELECT * FROM blood_samples WHERE user_id=$1 AND sample_id ILIKE $2',
      [user_id, sample_id]
    );
  }

  async function getBloodSampleForAllProbands(sample_id) {
    return await db.manyOrNone(
      'SELECT * FROM blood_samples WHERE upper(sample_id) = upper($1)',
      [sample_id]
    );
  }

  async function createLabResult(user_id, labResult) {
    labResult.sample_id = uppercaseOrNull(labResult.sample_id);
    labResult.dummy_sample_id = uppercaseOrNull(labResult.dummy_sample_id);
    await db.one(
      'UPDATE probands SET needs_material=FALSE WHERE pseudonym=$(pseudonym) RETURNING *',
      { pseudonym: user_id }
    );
    const values = [
      labResult.sample_id,
      user_id,
      null,
      null,
      'new',
      null,
      labResult.new_samples_sent,
      null,
      labResult.dummy_sample_id,
    ];
    return await db.one('INSERT INTO lab_results VALUES($1:csv) RETURNING *', [
      values,
    ]);
  }

  async function createBloodSample(user_id, bloodSample) {
    const values = [user_id, bloodSample.sample_id, null, null];
    return await db.one(
      'INSERT INTO blood_samples (user_id, sample_id, blood_sample_carried_out, remark) VALUES($1:csv) RETURNING *;',
      [values]
    );
  }

  async function updateLabResultAsPM(user_id, result_id, labResult) {
    return await db.one(
      'UPDATE lab_results SET remark=$1, new_samples_sent=$2 WHERE user_id=$3 AND id = $4 RETURNING *',
      [labResult.remark, labResult.new_samples_sent, user_id, result_id]
    );
  }

  async function updateBloodSampleAsUT(user_id, sample_id, remark) {
    return await db.one(
      'UPDATE blood_samples SET remark=$1 WHERE user_id=$2 AND sample_id ILIKE $3 RETURNING *',
      [remark, user_id, sample_id]
    );
  }

  async function updateStatusAsPM(user_id, result_id, status) {
    return await db.one(
      'UPDATE lab_results SET status=$1 WHERE user_id=$2 AND id = $3 RETURNING *',
      [status, user_id, result_id]
    );
  }

  async function updateStatusAsUT(
    user_id,
    sample_id,
    blood_sample_carried_out
  ) {
    return await db.one(
      'UPDATE blood_samples SET blood_sample_carried_out=$1 WHERE user_id=$2 AND sample_id=$3 RETURNING *',
      [blood_sample_carried_out, user_id, sample_id]
    );
  }

  async function updateLabResultAsProband(user_id, result_id, labResult) {
    return db.tx(async () => {
      await db.none(
        'UPDATE probands SET needs_material=TRUE WHERE pseudonym=$(pseudonym)',
        { pseudonym: user_id }
      );

      return await db.one(
        'UPDATE lab_results SET date_of_sampling=$1, status=$2 WHERE user_id=$3 AND id = $4 RETURNING *',
        [labResult.date_of_sampling, 'sampled', user_id, result_id]
      );
    });
  }

  async function requestNewMaterialFor(proband) {
    return await db.none(
      'UPDATE probands SET needs_material=TRUE WHERE pseudonym=$(pseudonym)',
      { pseudonym: proband }
    );
  }

  async function deleteLabResultAsPM(user_id, result_id) {
    return await db
      .tx(async () => {
        await db.any('DELETE FROM lab_observations WHERE lab_result_id=$1', [
          result_id,
        ]);
        const res = await db.one(
          'DELETE FROM lab_results WHERE user_id=$1 AND id=$2 RETURNING *',
          [user_id, result_id]
        );
        return res;
      })
      .catch((err) => {
        console.log(err);
      });
  }

  async function getLabObservationNames() {
    return await db.manyOrNone('SELECT DISTINCT name FROM lab_observations');
  }

  async function getUser(user_id) {
    return await db.one(
      'SELECT status FROM probands WHERE pseudonym=$(pseudonym)',
      { pseudonym: user_id }
    );
  }

  function uppercaseOrNull(value) {
    return value ? value.toUpperCase() : null;
  }

  return {
    /**
     * @function
     * @description gets all labresults for a proband
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getAllLabResultsForProband: getAllLabResultsForProband,

    /**
     * @function
     * @description gets labresult with a sample_id for all probands
     * @memberof module:postgresqlHelper
     * @param {string} sample_id the results id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getLabResultById: getLabResultById,

    /**
     * @function
     * @description gets all labresults of a proband for a professional user
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getAllLabResultsByProband: getAllLabResultsByProband,

    /**
     * @function
     * @description gets all blood samples for the given proband id
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getAllBloodSamplesForProband: getAllBloodSamplesForProband,

    /**
     * @function
     * @description gets a labresult
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} result_id the results id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getLabResult: getLabResult,

    /**
     * @function
     * @description gets a labresult for a proband
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} result_id the results id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getLabResultForProband: getLabResultForProband,

    /**
     * @function
     * @description gets a blood sample
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} sample_id the blood sample id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getBloodSample: getBloodSample,

    /**
     * @function
     * @description gets a blood sample for all probands
     * @memberof module:postgresqlHelper
     * @param {string} sample_id the blood sample id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getBloodSamplesBySampleId: getBloodSampleForAllProbands,

    /**
     * @function
     * @description creates a labresult
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {object} labResult the new lab result
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    createLabResult: createLabResult,

    /**
     * @function
     * @description creates a blood sample
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {object} bloodSample the new blood sample
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    createBloodSample: createBloodSample,

    /**
     * @function
     * @description updates a labresult as a PM
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} result_id the results id
     * @param {object} labResult the updated lab result
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    updateLabResultAsPM: updateLabResultAsPM,

    /**
     * @function
     * @description updates a blood sample as a UT
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} sample_id the blood sample id
     * @param {object} bloodSample the updated blood sample
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    updateBloodSampleAsUT: updateBloodSampleAsUT,

    /**
     * @function
     * @description updates a status of a labresult as a PM
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} result_id the results id
     * @param {string} status the updated lab result
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    updateStatusAsPM: updateStatusAsPM,

    /**
     * @function
     * @description updates a status of a labresult as a UT
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} sample_id the blood sample id
     * @param {string} blood_sample_carried_out the updated lab result
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    updateStatusAsUT: updateStatusAsUT,

    /**
     * @function
     * @description updates a labresult as a Proband
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} result_id the results id
     * @param {object} labResult the updated lab result
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    updateLabResultAsProband: updateLabResultAsProband,

    /**
     * @function
     * @description request new material for proband
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    requestNewMaterialFor: requestNewMaterialFor,

    /**
     * @function
     * @description updates a labresult as a Proband
     * @memberof module:postgresqlHelper
     * @param {string} user_id the probands id
     * @param {string} result_id the results id
     * @param {string} new status the updated lab result
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    deleteLabResultAsPM: deleteLabResultAsPM,

    /**
     * @function
     * @description gets all distinct names of lab_observations currently in the database
     * @memberof module:postgresqlHelper
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getLabObservationNames: getLabObservationNames,

    /**
     * @function
     * @description gets the user with the specidfied id
     * @memberof module:postgresqlHelper
     * @param {string} user_id the users id
     * @return {Promise} a resolved promise in case of success or a rejected otherwise
     */
    getUser: getUser,
  };
})();

module.exports = postgresqlHelper;
