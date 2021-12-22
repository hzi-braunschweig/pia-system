/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@pia-system/lib-http-clients-internal';
import { config } from '../config';
import { SormasStatus } from '../models/sormasStatus';
import { JournalPersonDto } from '../models/sormas';
import { SymptomsDto } from '../models/symptomsDto';
import util from 'util';
import { ExternalVisitDto } from '../models/externalVisitDto';

export class SormasClient {
  private static readonly service = config.sormas;

  private static readonly client: HttpClient = new HttpClient(
    SormasClient.service.url
  );

  /**
   * Transfers mapped questionnaire answers to SORMAS
   * @param uuid SORMAS person UUID
   * @param date Timestamp of questionnaire instance
   * @param version Version of answers
   * @param sormasData Key-Value pairs
   */
  public static async uploadVisit(
    uuid: string,
    date: Date,
    version: number,
    sormasData: SymptomsDto
  ): Promise<void> {
    const fullSormasData: ExternalVisitDto = {
      personUuid: uuid,
      visitStatus: 'COOPERATIVE',
      visitDateTime: date,
      visitRemarks: `Version ${version}`,
      disease: 'CORONAVIRUS',
      symptoms: sormasData,
    };

    if (config.verbose) {
      console.log(fullSormasData);
    }

    const json = await SormasClient.client.post(
      '/sormas-rest/visits-external/',
      [fullSormasData],
      {
        headers: SormasClient.getHeaders(),
      }
    );

    if (!json || !Array.isArray(json)) {
      throw new Error('visits-upload: received empty or malformed response');
    }
    if (json[0] !== 'OK') {
      console.error(json[0]);
      throw new Error('visits-upload: ' + json.toString());
    }
  }

  public static async waitForService(
    retryCount = 24,
    delay = 5000
  ): Promise<void> {
    const sleep = util.promisify(setTimeout);
    if (retryCount <= 0) throw new Error('retryCount must be greater than 0');

    for (let i = 0; i <= retryCount; i++) {
      try {
        await SormasClient.getApiVersion();
        return;
      } catch (e) {
        console.log(
          `${this.name}: service is not yet available. Waiting for ${delay} ms before next retry.`
        );
        if (i < retryCount) await sleep(delay);
      }
    }
    throw new Error(
      `${this.name}: Could not reach service after ${retryCount} retries.`
    );
  }

  /**
   * Returns version of the currently active SORMAS API
   */
  public static async getApiVersion(): Promise<string> {
    return await SormasClient.client.get(
      '/sormas-rest/visits-external/version',
      { headers: SormasClient.getHeaders() }
    );
  }

  /**
   * Transfers proband status to SORMAS
   * @param uuid
   * @param status
   */
  public static async setStatus(
    uuid: string,
    status: SormasStatus
  ): Promise<void> {
    const fullSormasData = {
      status: status,
      statusDateTime: new Date(),
    };
    if (config.verbose) {
      console.log(fullSormasData);
    }
    const json = await SormasClient.client.post(
      `/sormas-rest/visits-external/person/${uuid}/status`,
      fullSormasData,
      {
        headers: SormasClient.getHeaders(),
      }
    );
    if (json !== true) {
      console.error(json);
      throw new Error('set-status: ' + String(json));
    }
  }

  public static async getPerson(
    personUuid: string
  ): Promise<JournalPersonDto | null> {
    const json = await SormasClient.client.get(
      `/sormas-rest/visits-external/person/${personUuid}`,
      { headers: SormasClient.getHeaders() }
    );

    const personResponse = json as Omit<
      JournalPersonDto,
      'latestFollowUpEndDate'
    > & { latestFollowUpEndDate: number | null };
    return {
      ...personResponse,
      latestFollowUpEndDate:
        personResponse.latestFollowUpEndDate === null
          ? null
          : new Date(personResponse.latestFollowUpEndDate),
    };
  }

  private static getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization:
        'Basic ' +
        Buffer.from(
          SormasClient.service.username + ':' + SormasClient.service.password
        ).toString('base64'),
    };
  }
}
