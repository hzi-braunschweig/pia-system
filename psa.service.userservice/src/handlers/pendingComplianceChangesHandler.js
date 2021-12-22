/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pendingComplianceChangesInteractor = require('../interactors/pendingComplianceChangesInteractor');
const { handleError } = require('./handleError');
/**
 * @description HAPI Handler for pending compliance changes
 */
const pendingComplianceChangesHandler = (function () {
  async function getOne(request) {
    const id = request.params.id;

    return pendingComplianceChangesInteractor
      .getPendingComplianceChange(request.auth.credentials, id)
      .catch(handleError);
  }

  async function getAllOfStudy(request) {
    return pendingComplianceChangesInteractor
      .getPendingComplianceChanges(
        request.auth.credentials,
        request.params.studyName
      )
      .catch(handleError);
  }

  async function createOne(request) {
    return pendingComplianceChangesInteractor
      .createPendingComplianceChange(request.auth.credentials, request.payload)
      .catch(handleError);
  }

  async function updateOne(request) {
    const id = request.params.id;

    return pendingComplianceChangesInteractor
      .updatePendingComplianceChange(request.auth.credentials, id)
      .catch(handleError);
  }

  async function deleteOne(request) {
    const id = request.params.id;

    return pendingComplianceChangesInteractor
      .deletePendingComplianceChange(request.auth.credentials, id)
      .catch(handleError);
  }

  return {
    /**
     * @function
     * @description gets the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description gets the pending compliance changes for a study
     * @memberof module:pendingComplianceChangesHandler
     */
    getAllOfStudy: getAllOfStudy,

    /**
     * @function
     * @description creates the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description deletes the pending compliance change
     * @memberof module:pendingComplianceChangesHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = pendingComplianceChangesHandler;
