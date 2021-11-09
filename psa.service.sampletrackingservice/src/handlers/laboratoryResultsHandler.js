/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const {
  LaboratoryResultsInteractor,
} = require('../interactors/laboratoryResultsInteractor');
const laboratoryResultTemplateService = require('../services/laboratoryResultTemplateService');
const templatePipelineService = require('../services/templatePipelineService');
const Boom = require('@hapi/boom');

function handleError(error) {
  if (error instanceof Boom.Boom) {
    throw error;
  }
  console.error(error);
  throw Boom.internal('An internal Error happened');
}

/**
 * @description HAPI Handler for laboratory results
 */
const laboratoryResultsHandler = (function () {
  async function getAllResults(request) {
    const user_id = request.params.id;

    return LaboratoryResultsInteractor.getAllLaboratoryResults(
      request.auth.credentials,
      user_id
    ).catch(handleError);
  }

  async function getOneResult(request) {
    const user_id = request.params.user_id;
    const result_id = request.params.result_id;

    const labResult = await LaboratoryResultsInteractor.getOneLaboratoryResult(
      request.auth.credentials,
      user_id,
      result_id
    ).catch(handleError);

    if (request.headers.accept === 'text/html') {
      return templatePipelineService.generateLaboratoryResult(
        labResult,
        laboratoryResultTemplateService.getTemplate()
      );
    } else {
      return labResult;
    }
  }

  async function getOneResultWitSampleID(request) {
    const result_id = request.params.result_id;

    return LaboratoryResultsInteractor.getLaboratoryResultWithSampleID(
      request.auth.credentials,
      result_id
    ).catch(handleError);
  }

  function postLabResultsImport(request) {
    return LaboratoryResultsInteractor.postLabResultsImport(
      request.auth.credentials
    ).catch(handleError);
  }

  async function createOneResult(request) {
    const user_id = request.params.user_id;
    const token = request.auth.credentials;
    const labResult = request.payload;

    return LaboratoryResultsInteractor.createOneLaboratoryResult(
      token,
      user_id,
      labResult
    ).catch(handleError);
  }

  async function updateOneResult(request) {
    const user_id = request.params.user_id;
    const result_id = request.params.result_id;
    const token = request.auth.credentials;
    const labResult = request.payload;

    return LaboratoryResultsInteractor.updateOneLaboratoryResult(
      token,
      user_id,
      result_id,
      labResult
    ).catch(handleError);
  }

  return {
    /**
     * Returns all results
     * @param {Object} request
     * @param {Object} reply
     */
    getAllResults: getAllResults,

    /**
     * Returns single labor result
     * @param {Object} request
     * @param {Object} reply
     */
    getOneResult: getOneResult,

    /**
     * Returns single labor result
     * @param {Object} request
     * @param {Object} reply
     */
    getOneResultWitSampleID: getOneResultWitSampleID,

    /**
     * triggers labresults import from ftp server
     * @param {Object} request
     * @param {Object} reply
     */
    postLabResultsImport: postLabResultsImport,

    /**
     * creates a single labor result
     * @param {Object} request
     * @param {Object} reply
     */
    createOneResult: createOneResult,

    /**
     * updates a single labor result
     * @param {Object} request
     * @param {Object} reply
     */
    updateOneResult: updateOneResult,
  };
})();

module.exports = laboratoryResultsHandler;
