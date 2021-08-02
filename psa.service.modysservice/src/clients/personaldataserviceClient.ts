/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import * as Boom from '@hapi/boom';

import { PersonalDataReq } from '../models/personalData';
import { config } from '../config';

export class PersonaldataserviceClient {
  private static readonly serviceUrl = config.services.personaldataservice.url;
  /**
   * Updates the personal data for the proband with the given pseudonym
   */
  public static async updatePersonalData(
    pseudonym: string,
    data: PersonalDataReq
  ): Promise<void> {
    let res;
    try {
      res = await fetch.default(
        `${PersonaldataserviceClient.serviceUrl}/personal/personalData/proband/${pseudonym}`,
        {
          method: 'put',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'personaldataserviceClient updatePersonalData: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'personaldataserviceClient updatePersonalData: received an Error',
        await res.text(),
        res.status
      );
    }
  }
}
