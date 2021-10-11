/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import Boom from '@hapi/boom';
import { config } from '../config';

const serviceUrl = config.services.userservice.url;

export class UserserviceClient {
  public static async getProbandsWithAccessToFromProfessional(
    username: string
  ): Promise<string[]> {
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
    return (await res.json()) as string[];
  }

  public static async isUserExistentByUsername(
    username: string
  ): Promise<boolean> {
    let res;
    try {
      res = await fetch.default(`${serviceUrl}/user/users/${username}`, {
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'userserviceClient getProband: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      return false;
    }
    return true;
  }
}
