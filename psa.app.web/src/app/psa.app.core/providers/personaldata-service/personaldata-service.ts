/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { PersonalData } from '../../models/personalData';
import { HttpClient } from '@angular/common/http';
import { SystemLog, SystemLogFilter } from '../../models/systemLog';

@Injectable()
export class PersonalDataService {
  private readonly apiUrl = 'api/v1/personal/';

  constructor(private http: HttpClient) {}

  /**
   * Get personal data for a proband with probandID
   * @param probandId Proband Id
   * @return Pesonal data for proband with probandID
   */
  getPersonalDataFor(probandId: string): Promise<PersonalData> {
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
  putPersonalDataFor(
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
  getPersonalDataAll(): Promise<any> {
    return this.http.get(this.apiUrl + `personalData`).toPromise();
  }

  postPendingDeletion(postData: object): Promise<any> {
    return this.http
      .post(this.apiUrl + 'pendingdeletions', postData)
      .toPromise();
  }

  putPendingDeletion(probandUsername: string): Promise<any> {
    return this.http
      .put(this.apiUrl + 'pendingdeletions/' + probandUsername, null)
      .toPromise();
  }

  getPendingDeletionForProbandId(probandId: string): Promise<any> {
    return this.http
      .get(this.apiUrl + 'pendingdeletions/' + probandId)
      .toPromise();
  }

  async deletePendingDeletion(probandId: string): Promise<void> {
    await this.http
      .delete(this.apiUrl + 'pendingdeletions/' + probandId)
      .toPromise();
  }

  /**
   * Get deletion logs
   * @return deletion logs from iPia
   */
  getDeletionLogs(query: SystemLogFilter): Promise<SystemLog[]> {
    return this.http
      .get<SystemLog[]>(this.apiUrl + `deletionlogs`, { params: { ...query } })
      .toPromise();
  }
}
