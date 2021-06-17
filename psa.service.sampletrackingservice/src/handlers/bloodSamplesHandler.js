const bloodSamplesInteractor = require('../interactors/bloodSamplesInteractor');

/**
 * @description HAPI Handler for blood samples
 */
const bloodSamplesHandler = (function () {
  function getAllSamples(request) {
    const user_id = request.params.id;

    return bloodSamplesInteractor.getAllBloodSamples(
      request.auth.credentials,
      user_id
    );
  }

  function getOneSample(request) {
    return bloodSamplesInteractor.getOneBloodSample(
      request.auth.credentials,
      request.params.user_id,
      request.params.sample_id
    );
  }

  function getSampleWithSampleID(request) {
    return bloodSamplesInteractor.getBloodSampleWithSampleID(
      request.auth.credentials,
      request.params.sample_id
    );
  }

  function createOneSample(request) {
    const user_id = request.params.user_id;
    const bloodSample = request.payload;

    return bloodSamplesInteractor.createOneBloodSample(
      request.auth.credentials,
      user_id,
      bloodSample
    );
  }

  function updateOneSample(request) {
    const user_id = request.params.user_id;
    const sample_id = request.params.sample_id;
    const bloodSample = request.payload;

    return bloodSamplesInteractor.updateOneBloodSample(
      request.auth.credentials,
      user_id,
      sample_id,
      bloodSample
    );
  }

  return {
    /**
     * Returns all blood samples
     * @param {Object} request
     * @param {Object} reply
     */
    getAllSamples: getAllSamples,

    /**
     * Returns single blood sample
     * @param {Object} request
     * @param {Object} reply
     */
    getOneSample: getOneSample,

    /**
     * Returns single or more blood samples
     * @param {Object} request
     * @param {Object} reply
     */
    getSampleWithSampleID: getSampleWithSampleID,

    /**
     * creates a single blood sample
     * @param {Object} request
     * @param {Object} reply
     */
    createOneSample: createOneSample,

    /**
     * updates a single blood sample
     * @param {Object} request
     * @param {Object} reply
     */
    updateOneSample: updateOneSample,
  };
})();

module.exports = bloodSamplesHandler;
