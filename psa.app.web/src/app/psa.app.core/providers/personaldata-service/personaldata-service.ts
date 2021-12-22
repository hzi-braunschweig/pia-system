/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { PersonalData } from '../../models/personalData';
import { HttpClient } from '@angular/common/http';
import { PendingPersonalDataDeletion } from '../../models/pendingPersonalDataDeletion';

@Injectable()
export class PersonalDataService {
  private readonly apiUrl = 'api/v1/personal/';

  constructor(private http: HttpClient) {}

  /**
   * Get personal data for a proband with probandID
   * @param probandId Proband Id
   * @return Pesonal data for proband with probandID
   */
  public async getPersonalDataFor(probandId: string): Promise<PersonalData> {
    return this.http
      .get<PersonalData>(this.apiUrl + `personalData/proband/${probandId}`)
      .toPromise();
  }

  /**
   * Put personal data for a proband with probandID
   * @param probandId Proband Id
   * @param putData data to put
   * @return Pesonal data for proband with probandID
   */
  public async putPersonalDataFor(
    probandId: string,
    putData: object
  ): Promise<PersonalData> {
    return this.http
      .put<PersonalData>(
        this.apiUrl + `personalData/proband/${probandId}`,
        putData
      )
      .toPromise();
  }

  /**
   * Get personal data for every proband in the database
   * @return Pesonal data for every proband in the database
   */
  public async getPersonalDataAll(): Promise<PersonalData[]> {
    return this.http
      .get<PersonalData[]>(this.apiUrl + `personalData`)
      .toPromise();
  }

  public async postPendingDeletion(postData: object): Promise<void> {
    await this.http
      .post(this.apiUrl + 'pendingdeletions', postData)
      .toPromise();
  }

  public async putPendingDeletion(probandUsername: string): Promise<void> {
    await this.http
      .put(this.apiUrl + 'pendingdeletions/' + probandUsername, null)
      .toPromise();
  }

  public async getPendingDeletionForProbandId(
    probandId: string
  ): Promise<PendingPersonalDataDeletion> {
    return this.http
      .get<PendingPersonalDataDeletion>(
        this.apiUrl + 'pendingdeletions/' + probandId
      )
      .toPromise();
  }

  public async deletePendingDeletion(probandId: string): Promise<void> {
    await this.http
      .delete(this.apiUrl + 'pendingdeletions/' + probandId)
      .toPromise();
  }

  public async getPendingPersonalDataDeletions(
    studyName: string
  ): Promise<PendingPersonalDataDeletion[]> {
    return this.http
      .get<PendingPersonalDataDeletion[]>(
        `${this.apiUrl}studies/${studyName}/pendingdeletions`
      )
      .toPromise();
  }
}
