/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const laboratoryResultsInteractor = require('../interactors/laboratoryResultsInteractor');
const laboratoryResultTemplateService = require('../services/laboratoryResultTemplateService');
const templatePipelineService = require('../services/templatePipelineService');

/**
 * @description HAPI Handler for laboratory results
 */
const laboratoryResultsHandler = (function () {
  function getAllResults(request) {
    const user_id = request.params.id;

    return laboratoryResultsInteractor.getAllLaboratoryResults(
      request.auth.credentials,
      user_id
    );
  }

  async function getOneResult(request) {
    const user_id = request.params.user_id;
    const result_id = request.params.result_id;

    const labResult = await laboratoryResultsInteractor.getOneLaboratoryResult(
      request.auth.credentials,
      user_id,
      result_id
    );

    if (request.headers.accept === 'text/html') {
      return templatePipelineService.generateLaboratoryResult(
        labResult,
        laboratoryResultTemplateService.getTemplate()
      );
    } else {
      return labResult;
    }
  }

  function getOneResultWitSampleID(request) {
    const result_id = request.params.result_id;

    return laboratoryResultsInteractor.getLaboratoryResultWithSampleID(
      request.auth.credentials,
      result_id
    );
  }

  function postLabResultsImport(request) {
    return laboratoryResultsInteractor.postLabResultsImport(
      request.auth.credentials
    );
  }

  function createOneResult(request) {
    const user_id = request.params.user_id;
    const token = request.auth.credentials;
    const labResult = request.payload;

    return laboratoryResultsInteractor.createOneLaboratoryResult(
      token,
      user_id,
      labResult
    );
  }

  function updateOneResult(request) {
    const user_id = request.params.user_id;
    const result_id = request.params.result_id;
    const token = request.auth.credentials;
    const labResult = request.payload;

    return laboratoryResultsInteractor.updateOneLaboratoryResult(
      token,
      user_id,
      result_id,
      labResult
    );
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
