/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import { config } from '../config';
import Boom from '@hapi/boom';

export interface LatestFollowUpEndDateForPerson {
  latestFollowUpEndDate: number;
  personUuid: string;
}

export class SormasserviceClient {
  private static readonly service = config.services.sormasservice;

  public static async getEndDatesForSormasProbands(
    since: Date
  ): Promise<LatestFollowUpEndDateForPerson[]> {
    if (!config.isSormasActive) {
      return [];
    }

    let res;
    try {
      res = await fetch.default(
        `${
          SormasserviceClient.service.url
        }/sormas/probands/followUpEndDates/${since.getTime()}`,
        {
          method: 'get',
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (e) {
      throw Boom.serverUnavailable(
        'sormasserviceClient getEndDatesForSormasProbands: Did not receive a response',
        e
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'sormasserviceClient getEndDatesForSormasProbands: received an Error',
        await res.text(),
        res.status
      );
    }
    return (await res.json()) as LatestFollowUpEndDateForPerson[];
  }
}
