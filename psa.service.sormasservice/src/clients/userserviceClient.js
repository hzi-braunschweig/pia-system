/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const service = config.services.userservice;

class UserserviceClient {
  static async deleteUserdata(userId, keepUsageData) {
    let res;
    try {
      const params = new URLSearchParams({ keepUsageData });
      res = await fetch.default(
        `${service.url}/user/users/${userId}?${params}`,
        {
          method: 'delete',
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient deleteUserdata: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient deleteUserdata: received an Error',
        await res.text(),
        res.status
      );
    }
  }
}

module.exports = UserserviceClient;
