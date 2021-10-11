/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import * as Boom from '@hapi/boom';
import { config } from '../config';

const serviceUrl = config.services.personaldataservice.url;

export class PersonaldataserviceClient {
  /**
   * Deletes the personal data of the proband based on the given username
   * @param {string} username
   * @return {Promise<string>}
   * @throws {Boom.Boom}
   */
  public static async getPersonalDataEmail(username: string): Promise<string> {
    let res;
    try {
      res = await fetch.default(
        `${serviceUrl}/personal/personalData/proband/${username}/email`,
        {
          method: 'get',
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'personalDataserviceClient getPersonalDataEmail: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'personalDataserviceClient getPersonalDataEmail: received an Error',
        await res.text(),
        res.status
      );
    }
    return res.text();
  }
}
