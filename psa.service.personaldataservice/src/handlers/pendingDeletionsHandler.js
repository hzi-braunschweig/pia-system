/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const pendingDeletionsInteractor = require('../interactors/pendingDeletionsInteractor');
const handleError = require('../handleError');

class PendingDeletionsHandler {
  /**
   * gets the pending deletion
   * @param request
   * @return {Promise<*>}
   */
  static getOne(request) {
    return pendingDeletionsInteractor
      .getPendingDeletion(request.auth.credentials, request.params.proband_id)
      .catch((err) =>
        handleError(request, 'Could not get pending deletion:', err)
      );
  }

  /**
   * creates the pending deletion
   * @param request
   * @return {Promise<*>}
   */
  static createOne(request) {
    return pendingDeletionsInteractor
      .createPendingDeletion(request.auth.credentials, request.payload)
      .catch((err) =>
        handleError(request, 'Could not create pending deletion:', err)
      );
  }

  /**
   * executes the pending deletion
   * @param request
   * @return {Promise<*>}
   */
  static updateOne(request) {
    return pendingDeletionsInteractor
      .executePendingDeletion(
        request.auth.credentials,
        request.params.proband_id
      )
      .catch((err) =>
        handleError(request, 'Could not update pending deletion:', err)
      );
  }

  /**
   * deletes the pending deletion
   * @param request
   * @return {Promise<*>}
   */
  static deleteOne(request) {
    return pendingDeletionsInteractor
      .deletePendingDeletion(
        request.auth.credentials,
        request.params.proband_id
      )
      .then(() => null)
      .catch((err) =>
        handleError(request, 'Could not delete pending deletion:', err)
      );
  }
}

module.exports = PendingDeletionsHandler;
