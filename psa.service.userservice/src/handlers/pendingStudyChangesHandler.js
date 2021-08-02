/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const postgresqlHelper = require('../services/postgresqlHelper.js');
const pendingStudyChangesInteractor = require('../interactors/pendingStudyChangesInteractor.js');

/**
 * @description HAPI Handler for pending study changes
 */
const pendingStudyChangesHandler = (function () {
  function createOne(request) {
    return pendingStudyChangesInteractor.createPendingStudyChange(
      request.auth.credentials,
      request.payload,
      postgresqlHelper
    );
  }

  function updateOne(request) {
    const id = request.params.id;

    return pendingStudyChangesInteractor.updatePendingStudyChange(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function deleteOne(request) {
    const id = request.params.id;

    return pendingStudyChangesInteractor.deletePendingStudyChange(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  return {
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

module.exports = pendingStudyChangesHandler;
