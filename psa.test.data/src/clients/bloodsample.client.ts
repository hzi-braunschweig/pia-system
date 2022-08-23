/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import fetch from '../utils/fetch.util';
import chalk from 'chalk';
import { AuthToken } from '../models/user.model';
import { BloodSample } from '../models/blood-sample.model';

export class BloodSampleClient {
  constructor(private readonly baseUrl) {}

  async createBloodSample(
    probandId: string,
    sampleId: string,
    utToken: () => Promise<AuthToken>
  ) {
    const response = await fetch(
      this.baseUrl + `/sample/probands/${probandId}/bloodSamples`,
      {
        method: 'post',
        body: JSON.stringify({ sample_id: sampleId }),
        headers: {
          Authorization: await utToken(),
          'Content-Type': 'application/json',
        },
      }
    );
    const body = (await response?.json()) as {
      name: string;
      sample_id: string;
    };
    console.log(
      chalk.blue('BloodSampleClient: created bloodsample: ' + body.sample_id)
    );
    return body.name;
  }

  async changeBloodSample(
    probandId: string,
    sampleId: string,
    bloodSample: BloodSample,
    utToken: () => Promise<AuthToken>
  ) {
    const response = await fetch(
      this.baseUrl + `/sample/probands/${probandId}/bloodSamples/${sampleId}`,
      {
        method: 'put',
        body: JSON.stringify(bloodSample),
        headers: {
          Authorization: await utToken(),
          'Content-Type': 'application/json',
        },
      }
    );
    const body = await response?.json();
    console.log(
      chalk.blue('BloodSampleClient: put bloodsample: ' + body.sample_id)
    );
    return body.name;
  }
}
