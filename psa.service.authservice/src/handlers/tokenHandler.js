/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Crypto = require('crypto');
const Boom = require('@hapi/boom');
const tokenService = require('../services/tokenService.js');

const tokenHandler = (function () {
  async function requestToken() {
    try {
      const token = Crypto.randomBytes(32).toString('hex');
      await tokenService.storeToken(token);
      return { auth: token };
    } catch (exc) {
      return Boom.internal('Token could not be stored internally');
    }
  }

  return {
    /**
     * @function
     * @description Generates and retrieves the token
     * @memberof module:tokenHandler
     */
    requestToken: requestToken,
  };
})();

module.exports = tokenHandler;
