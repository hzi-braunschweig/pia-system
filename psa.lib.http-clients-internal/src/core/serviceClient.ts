/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import util from 'util';
import { HttpClient } from './httpClient';

export abstract class ServiceClient {
  protected httpClient = new HttpClient(this.serviceUrl);

  public constructor(protected readonly serviceUrl: string) {}

  public async waitForService(retryCount = 24, delay = 5000): Promise<void> {
    const sleep = util.promisify(setTimeout);
    if (retryCount <= 0) throw new Error('retryCount must be greater than 0');

    for (let i = 0; i <= retryCount; i++) {
      try {
        await HttpClient.fetch(this.serviceUrl);
        return;
      } catch (e) {
        console.log(
          `${this.serviceUrl}: service is not yet available. Waiting for ${delay} ms before next retry.`
        );
        if (i < retryCount) await sleep(delay);
      }
    }
    throw new Error(
      `${this.serviceUrl}: Could not reach service after ${retryCount} retries`
    );
  }
}
