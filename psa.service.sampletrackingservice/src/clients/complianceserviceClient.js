/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.complianceservice.url;

class ComplianceserviceClient {
  /**
   * Checks if the user has given requested compliance
   * @param {string} user_id
   * @param {string} study_name
   * @param {string|string[]} systemCompliance
   * @return {Promise<boolean>}
   */
  static async hasAgreedToCompliance(user_id, study_name, systemCompliance) {
    let query;
    if (Array.isArray(systemCompliance)) {
      query =
        '?' + systemCompliance.map((comp) => 'system[]=' + comp).join('&');
    } else {
      query = '?system=' + systemCompliance;
    }
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/compliance/${study_name}/agree/${user_id}` + query,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'complianceserviceClient hasAgreedToCompliance: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'complianceserviceClient hasAgreedToCompliance: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }
}

module.exports = ComplianceserviceClient;
