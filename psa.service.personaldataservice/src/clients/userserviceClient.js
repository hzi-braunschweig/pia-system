/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.userservice.url;

class UserserviceClient {
  static async getProband(pseudonym) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/user/users/${pseudonym}`, {
        method: 'get',
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        `userserviceClient getProband: ${pseudonym}: Did not receive a response`,
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getProband: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.json();
  }

  static async getPrimaryStudy(pseudonym) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/user/users/${pseudonym}/primaryStudy`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getPrimaryStudy: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getPrimaryStudy: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }

  /**
   * @param username
   * @returns {Promise<string[]>}
   */
  static async getProbandsWithAccessToFromProfessional(username) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/user/professional/${username}/allProbands`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getProbandsWithAccessToFromProfessional: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getProbandsWithAccessToFromProfessional: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }
}

module.exports = UserserviceClient;
