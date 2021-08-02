/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceConfig = config.services.userservice;
const serviceUrl = `${serviceConfig.protocol}://${serviceConfig.host}:${serviceConfig.port}`;

class UserserviceClient {
  static async getProbandsWithAcessToFromProfessional(user_id) {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/user/professional/${user_id}/allProbands`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getProbandsWithAcessToFromProfessional: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getProbandsWithAcessToFromProfessional: received an Error',
        await res.text(),
        res.status
      );
    }

    return await res.json();
  }
}

module.exports = UserserviceClient;
