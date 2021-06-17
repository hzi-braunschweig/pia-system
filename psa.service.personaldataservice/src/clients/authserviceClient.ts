import * as fetch from 'node-fetch';
import Boom from '@hapi/boom';
import { config } from '../config';
import { User } from '../models/User';

export class AuthserviceClient {
  private static readonly serviceUrl = config.services.authservice.url;

  public static async updateUser(user: User): Promise<void> {
    let res;
    try {
      res = await fetch.default(`${AuthserviceClient.serviceUrl}/auth/user`, {
        method: 'patch',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch (e) {
      throw Boom.serverUnavailable(
        'authserviceClient updateUser: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'authserviceClient updateUser: received an Error',
        await res.text(),
        res.status
      );
    }
  }
}
