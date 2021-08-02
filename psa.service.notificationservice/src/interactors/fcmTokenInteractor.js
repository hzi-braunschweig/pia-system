/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const postgresqlHelper = require('../services/postgresqlHelper.js');

/**
 * @description interactor that handles fcmToken requests based on users permissions
 */
const fcmTokenInteractor = (function () {
  function createFCMToken(decodedToken, fcm_token) {
    return postgresqlHelper.updateFCMToken(decodedToken.username, fcm_token);
  }

  return {
    /**
     * @function
     * @description cheks the token and creates a new fcm token for user
     * @memberof module:fcmTokenInteractor
     * @param {string} userToken the jwt of the request
     * @param {string} fcm_token the fcm token to post
     * @returns object promise a promise that will be resolved in case of success or rejected otherwise
     */
    createFCMToken: createFCMToken,
  };
})();

module.exports = fcmTokenInteractor;
