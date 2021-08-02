/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.sormasservice.url;

class SormasserviceClient {
  static async setStatus(uuid, status) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/sormas/probands/setStatus`, {
        method: 'post',
        body: JSON.stringify({ uuid, status }),
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'sormasserviceClient setStatus: ${uuid}: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'sormasserviceClient setStatus: ${uuid}: received an Error',
        await res.text(),
        res.status
      );
    }
  }
}

module.exports = SormasserviceClient;
