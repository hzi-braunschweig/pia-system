/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import * as Boom from '@hapi/boom';

import { config } from '../config';
import { AccountStatus } from '../models/user';
import { isArrayOfStrings } from '@pia/lib-service-core';

export class UserserviceClient {
  private static readonly serviceUrl = config.services.userservice.url;

  /**
   * Gets all pseudonyms from pia that are in a specific study or have a specific status account
   */
  public static async getPseudonyms(
    study?: string,
    accountStatus?: AccountStatus | AccountStatus[]
  ): Promise<string[]> {
    const query = new URLSearchParams();
    if (typeof study === 'string') {
      query.append('study', study);
    }
    if (typeof accountStatus === 'string') {
      query.append('accountStatus', accountStatus);
    } else if (Array.isArray(accountStatus)) {
      accountStatus.forEach((status) => query.append('accountStatus', status));
    }
    let res;
    try {
      res = await fetch.default(
        `${UserserviceClient.serviceUrl}/user/pseudonyms?${query.toString()}`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getPseudonyms: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'userserviceClient getPseudonyms: received an Error',
        await res.text(),
        res.status
      );
    }
    const body: unknown = await res.json();
    if (isArrayOfStrings(body)) {
      return body;
    } else {
      throw Boom.internal(`Expected array of strings but got: ${typeof body}`);
    }
  }
}
