/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import * as Boom from '@hapi/boom';

import { config } from '../config';
import { User } from '../models/user';

export class UserserviceClient {
  private static readonly serviceUrl = config.services.userservice.url;

  public static async getProband(pseudonym: string): Promise<User | null> {
    let res;
    try {
      res = await fetch.default(`${this.serviceUrl}/user/users/${pseudonym}`, {
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
    return (await res.json()) as User | null;
  }

  public static async getPrimaryStudy(
    pseudonym: string
  ): Promise<{ name: string }> {
    let res;
    try {
      res = await fetch.default(
        `${this.serviceUrl}/user/users/${pseudonym}/primaryStudy`,
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
    return (await res.json()) as { name: string };
  }

  public static async getProbandsWithAccessToFromProfessional(
    username: string
  ): Promise<string[]> {
    let res;
    try {
      res = await fetch.default(
        `${this.serviceUrl}/user/professional/${username}/allProbands`,
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
}
