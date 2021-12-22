/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pendingDeletionsInteractor = require('../interactors/pendingDeletionsInteractor');
const { handleError } = require('./handleError');

/**
 * @description HAPI Handler for pending deletions
 */
const pendingDeletionsHandler = (function () {
  async function getOne(request) {
    const id = request.params.id;

    return pendingDeletionsInteractor.getPendingDeletion(
      request.auth.credentials,
      id
    );
  }

  async function getOneForProbandId(request) {
    const proband_id = request.params.proband_id;

    return pendingDeletionsInteractor.getPendingDeletionForProbandId(
      request.auth.credentials,
      proband_id
    );
  }

  async function getOneForSampleId(request) {
    const sample_id = request.params.sample_id;

    return pendingDeletionsInteractor.getPendingDeletionForSampleId(
      request.auth.credentials,
      sample_id
    );
  }

  async function getOneForStudyId(request) {
    const study_id = request.params.study_id;

    return pendingDeletionsInteractor.getPendingDeletionForStudyId(
      request.auth.credentials,
      study_id
    );
  }

  async function getAllOfStudy(request) {
    return pendingDeletionsInteractor
      .getPendingDeletions(
        request.auth.credentials,
        request.params.studyName,
        request.query.type
      )
      .catch(handleError);
  }

  async function createOne(request) {
    return pendingDeletionsInteractor
      .createPendingDeletion(request.auth.credentials, request.payload)
      .catch(handleError);
  }

  async function updateOne(request) {
    const id = request.params.id;

    await pendingDeletionsInteractor.updatePendingDeletion(
      request.auth.credentials,
      id
    );
    return null;
  }

  async function deleteOne(request) {
    const id = request.params.id;

    await pendingDeletionsInteractor.cancelPendingDeletion(
      request.auth.credentials,
      id
    );
    return null;
  }

  return {
    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description gets the pending deletion for proband_id
     * @memberof module:pendingDeletionsHandler
     */
    getOneForProbandId: getOneForProbandId,

    /**
     * @function
     * @description gets the pending deletion for sample_id
     * @memberof module:pendingDeletionsHandler
     */
    getOneForSampleId: getOneForSampleId,

    /**
     * @function
     * @description gets the pending deletion for study_id
     * @memberof module:pendingDeletionsHandler
     */
    getOneForStudyId: getOneForStudyId,

    getAllOfStudy: getAllOfStudy,

    /**
     * @function
     * @description creates the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description deletes the pending deletion
     * @memberof module:pendingDeletionsHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = pendingDeletionsHandler;
