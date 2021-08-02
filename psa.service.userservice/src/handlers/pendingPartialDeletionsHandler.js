/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const postgresqlHelper = require('../services/postgresqlHelper.js');
const pendingPartialDeletionsInteractor = require('../interactors/pendingPartialDeletionsInteractor.js');

/**
 * @description HAPI Handler for pending partial deletions
 */
const pendingPartialDeletionsHandler = (function () {
  function getOne(request) {
    const id = request.params.id;

    return pendingPartialDeletionsInteractor.getPendingPartialDeletion(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function createOne(request) {
    return pendingPartialDeletionsInteractor.createPendingPartialDeletion(
      request.auth.credentials,
      request.payload,
      postgresqlHelper
    );
  }

  function updateOne(request) {
    const id = request.params.id;

    return pendingPartialDeletionsInteractor.updatePendingPartialDeletion(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  function deleteOne(request) {
    const id = request.params.id;

    return pendingPartialDeletionsInteractor.deletePendingPartialDeletion(
      request.auth.credentials,
      id,
      postgresqlHelper
    );
  }

  return {
    /**
     * @function
     * @description gets the pending deletion
     * @memberof module:pendingPartialDeletionsHandler
     */
    getOne: getOne,

    /**
     * @function
     * @description creates the pending deletion
     * @memberof module:pendingPartialDeletionsHandler
     */
    createOne: createOne,

    /**
     * @function
     * @description updates the pending deletion
     * @memberof module:pendingPartialDeletionsHandler
     */
    updateOne: updateOne,

    /**
     * @function
     * @description deletes the pending deletion
     * @memberof module:pendingPartialDeletionsHandler
     */
    deleteOne: deleteOne,
  };
})();

module.exports = pendingPartialDeletionsHandler;
