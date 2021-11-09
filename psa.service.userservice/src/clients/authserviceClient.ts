/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { User } from '../models/user';

import * as fetch from 'node-fetch';
import Boom from '@hapi/boom';

import { config } from '../config';

export class AuthserviceClient {
  private static readonly serviceUrl = config.services.authservice.url;

  public static async createUser(user: User): Promise<User> {
    let res;
    try {
      res = await fetch.default(`${this.serviceUrl}/auth/user`, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'AuthserviceClient createUser: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'AuthserviceClient createUser: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.json() as Promise<User>;
  }

  public static async updateUser(
    user: User & { new_username?: string }
  ): Promise<User> {
    let res;
    try {
      res = await fetch.default(`${this.serviceUrl}/auth/user`, {
        method: 'patch',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'AuthserviceClient updateUser: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'AuthserviceClient updateUser: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.json() as Promise<User>;
  }
}
