/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const fetch = require('node-fetch');
const Boom = require('@hapi/boom');
const { config } = require('../config');

const serviceUrl = config.services.loggingservice.url;

/**
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     type: string
 * }} SystemLogReq
 *
 * @typedef {{
 *     requestedBy: string,
 *     requestedFor: string,
 *     timestamp: Date,
 *     type: ('proband'|'sample'|'study'|'compliance'|'study_change'|'partial')
 * }} SystemLogRes
 */

class LoggingserviceClient {
  /**
   *
   * @param {SystemLogReq} log
   * @return {Promise<SystemLogRes>}
   */
  static async createSystemLog(log) {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/log/systemLogs`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'loggingserviceClient sendSystemLog: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'loggingserviceClient sendSystemLog: received an Error',
        await res.text(),
        res.status
      );
    }
    return await res.json();
  }
}

module.exports = LoggingserviceClient;
