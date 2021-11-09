/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const {
  BloodSamplesInteractor,
} = require('../interactors/bloodSamplesInteractor');
const Boom = require('@hapi/boom');

function handleError(error) {
  if (error instanceof Boom.Boom) {
    throw error;
  }
  console.error(error);
  throw Boom.internal('An internal Error happened');
}

/**
 * @description HAPI Handler for blood samples
 */
const bloodSamplesHandler = (function () {
  async function getAllSamples(request) {
    const user_id = request.params.id;

    return BloodSamplesInteractor.getAllBloodSamples(
      request.auth.credentials,
      user_id
    ).catch(handleError);
  }

  async function getOneSample(request) {
    return BloodSamplesInteractor.getOneBloodSample(
      request.auth.credentials,
      request.params.user_id,
      request.params.sample_id
    ).catch(handleError);
  }

  async function getSampleWithSampleID(request) {
    return BloodSamplesInteractor.getBloodSampleWithSampleID(
      request.auth.credentials,
      request.params.sample_id
    ).catch(handleError);
  }

  async function createOneSample(request) {
    const user_id = request.params.user_id;
    const bloodSample = request.payload;

    return BloodSamplesInteractor.createOneBloodSample(
      request.auth.credentials,
      user_id,
      bloodSample
    ).catch(handleError);
  }

  async function updateOneSample(request) {
    const user_id = request.params.user_id;
    const sample_id = request.params.sample_id;
    const bloodSample = request.payload;

    return BloodSamplesInteractor.updateOneBloodSample(
      request.auth.credentials,
      user_id,
      sample_id,
      bloodSample
    ).catch(handleError);
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
