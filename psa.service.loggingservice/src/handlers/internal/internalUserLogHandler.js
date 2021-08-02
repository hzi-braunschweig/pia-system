/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');
const internalLoggingInteractor = require('../../interactors/internal/internalUserLogInteractor');

class InternalUserLogHandler {
  /**
   * Creates a user log
   * @param {import('@hapi/hapi').Request} request
   */
  static async postLog(request) {
    return internalLoggingInteractor
      .postLog(request.params.user_id, request.payload)
      .catch((err) => {
        request.log(['error'], 'Could not insert user log in DB: ' + err);
        return Boom.notFound(err);
      });
  }
  /**
   * Deletes all logs of a user
   * @param {import('@hapi/hapi').Request} request
   * @return {Promise<null>}
   */
  static async deleteLog(request) {
    return internalLoggingInteractor.deleteLog(
      request.params.userId,
      request.query
    );
  }
}

module.exports = InternalUserLogHandler;
