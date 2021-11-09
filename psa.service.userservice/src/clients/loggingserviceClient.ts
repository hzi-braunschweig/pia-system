/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import Boom from '@hapi/boom';

import { config } from '../config';
import {
  SystemLogRequest,
  SystemLogResponse,
  UserLogFilter,
} from '../models/log';

export class LoggingserviceClient {
  private static readonly serviceUrl = config.services.loggingservice.url;
  /**
   *
   * @param userId
   * @param {UserLogFilter} filter
   * @return {Promise<void>}
   */
  public static async deleteLogs(
    userId: string,
    filter?: UserLogFilter
  ): Promise<void> {
    let res;
    try {
      let query = '';
      if (filter) {
        const params = new URLSearchParams();
        if (filter.fromTime instanceof Date)
          params.append('fromTime', filter.fromTime.toISOString());
        if (filter.toTime instanceof Date)
          params.append('toTime', filter.toTime.toISOString());
        query = '?' + params.toString();
      }
      res = await fetch.default(
        `${this.serviceUrl}/log/logs/${userId}${query}`,
        {
          method: 'delete',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'loggingserviceClient deleteLogs: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'loggingserviceClient deleteLogs: received an Error',
        await res.text(),
        res.status
      );
    }
  }

  public static async createSystemLog(
    log: SystemLogRequest
  ): Promise<SystemLogResponse> {
    let res;
    try {
      res = await fetch.default(`${this.serviceUrl}/log/systemLogs`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'loggingserviceClient createSystemLog: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'loggingserviceClient createSystemLog: received an Error',
        await res.text(),
        res.status
      );
    }
    return (await res.json()) as SystemLogResponse;
  }
}
