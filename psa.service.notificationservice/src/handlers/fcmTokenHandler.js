/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Boom = require('@hapi/boom');

const fcmTokenInteractor = require('../interactors/fcmTokenInteractor.js');

/**
 * @description HAPI Handler for fcm tokens
 */
const fcmTokenHandler = (function () {
  function postOne(request) {
    return fcmTokenInteractor
      .createFCMToken(request.auth.credentials, request.payload.fcm_token)
      .catch((errorMessage) => {
        console.log('Could not create fcm token:', errorMessage);
        return Boom.internal(errorMessage);
      });
  }

  return {
    /**
     * @function
     * @description post the fcm token for the user
     * @memberof module:fcmTokenHandler
     */
    postOne: postOne,
  };
})();

module.exports = fcmTokenHandler;
