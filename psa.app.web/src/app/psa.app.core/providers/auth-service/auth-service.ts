/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { ProfessionalUser } from '../../models/user';
import { PlannedProband } from '../../models/plannedProband';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, pluck } from 'rxjs/operators';
import {
  PendingPartialDeletionRequest,
  PendingPartialDeletionResponse,
} from '../../models/pendingPartialDeletion';
import { PendingComplianceChange } from '../../models/pendingComplianceChange';
import {
  CreateIDSProbandRequest,
  CreateProbandRequest,
  Proband,
} from '../../models/proband';
import {
  PendingDeletion,
  PendingProbandDeletion,
  PendingSampleDeletion,
} from '../../models/pendingDeletion';

/**
 * Probands may choose to delete their account and all health data (full) or
 * to delete their account and contact data but leave their health data.
 */
export type ProbandAccountDeletionType = 'full' | 'contact';

@Injectable()
export class AuthService {
  constructor(public http: HttpClient) {}

  private readonly apiUrl = 'api/v1/user/';

  private static mapProbandResponseDates = map((proband: Proband): Proband => {
    if (typeof proband.firstLoggedInAt === 'string') {
      proband.firstLoggedInAt = new Date(proband.firstLoggedInAt);
    }
    return proband;
  });

  private pendingPartialDeletionDateConverter = map(
    (deletion: PendingPartialDeletionResponse) => {
      deletion.fromDate = deletion.fromDate
        ? new Date(deletion.fromDate)
        : null;
      deletion.toDate = deletion.toDate ? new Date(deletion.toDate) : null;
      return deletion;
    }
  );

  public getProband(pseudonym: string): Promise<Proband> {
    return this.http
      .get<Proband>(this.apiUrl + 'users/' + pseudonym)
      .pipe(AuthService.mapProbandResponseDates)
      .toPromise();
  }

  public getProbandByIDS(ids: string): Promise<Proband> {
    return this.http
      .get<Proband>(this.apiUrl + 'users/ids/' + ids)
      .pipe(AuthService.mapProbandResponseDates)
      .toPromise();
  }

  public deleteUser(username: string): Promise<void> {
    return this.http
      .delete<void>(this.apiUrl + 'users/' + username)
      .toPromise();
  }

  public async postUser(postData: ProfessionalUser): Promise<void> {
    await this.http.post(this.apiUrl + 'users', postData).toPromise();
  }

  public postProband(
    postData: CreateProbandRequest,
    studyName: string
  ): Promise<void> {
    return this.http
      .post<void>(this.apiUrl + 'studies/' + studyName + '/probands', postData)
      .toPromise();
  }

  public postIDS(
    postData: CreateIDSProbandRequest,
    studyName: string
  ): Promise<void> {
    return this.http
      .post<void>(
        this.apiUrl + 'studies/' + studyName + '/probandsIDS',
        postData
      )
      .toPromise();
  }

  public async patchProband(
    username: string,
    changedData: { is_test_proband: boolean }
  ): Promise<void> {
    await this.http
      .patch(this.apiUrl + 'users/' + username, changedData)
      .toPromise();
  }

  getPlannedProbands(): Promise<PlannedProband[]> {
    return this.http
      .get<{ plannedprobands: PlannedProband[] }>(
        this.apiUrl + 'plannedprobands'
      )
      .pipe(pluck('plannedprobands'))
      .toPromise();
  }

  getPlannedProband(user_id: string): Promise<PlannedProband> {
    return this.http
      .get<PlannedProband>(this.apiUrl + 'plannedprobands/' + user_id)
      .toPromise();
  }

  deletePlannedProband(user_id: string): Promise<PlannedProband> {
    return this.http
      .delete<PlannedProband>(this.apiUrl + 'plannedprobands/' + user_id)
      .toPromise();
  }

  postPlannedProbands(postData: object): Promise<PlannedProband[]> {
    return this.http
      .post<{ plannedprobands: PlannedProband[] }>(
        this.apiUrl + 'plannedprobands',
        postData
      )
      .pipe(pluck('plannedprobands'))
      .toPromise();
  }

  public async postPendingDeletion(postData: object): Promise<void> {
    await this.http
      .post(this.apiUrl + 'pendingdeletions', postData)
      .toPromise();
  }

  public async putPendingDeletion(pendingDeletionId: number): Promise<void> {
    await this.http
      .put(this.apiUrl + 'pendingdeletions/' + pendingDeletionId, null)
      .toPromise();
  }

  public async getPendingDeletion(
    pendingdeletionId: number
  ): Promise<PendingDeletion> {
    return this.http
      .get<PendingDeletion>(
        this.apiUrl + 'pendingdeletions/' + pendingdeletionId
      )
      .toPromise();
  }

  public async getPendingDeletionForProbandId(
    probandId: string
  ): Promise<PendingProbandDeletion> {
    return this.http
      .get<PendingProbandDeletion>(
        this.apiUrl + 'pendingdeletions/proband/' + probandId
      )
      .toPromise();
  }

  public async getPendingDeletionForSampleId(
    sampleId: string
  ): Promise<PendingSampleDeletion> {
    return this.http
      .get<PendingSampleDeletion>(
        this.apiUrl + 'pendingdeletions/sample/' + sampleId
      )
      .toPromise();
  }

  public async deletePendingDeletion(pendingDeletionId: number): Promise<void> {
    await this.http
      .delete<void>(this.apiUrl + 'pendingdeletions/' + pendingDeletionId)
      .toPromise();
  }

  postPendingPartialDeletion(
    postData: PendingPartialDeletionRequest
  ): Promise<PendingPartialDeletionResponse> {
    return this.http
      .post<PendingPartialDeletionResponse>(
        this.apiUrl + 'pendingpartialdeletions',
        postData
      )
      .pipe(this.pendingPartialDeletionDateConverter)
      .toPromise();
  }

  getPendingPartialDeletion(
    pendingPartialDeletionId: number
  ): Promise<PendingPartialDeletionResponse> {
    return this.http
      .get<PendingPartialDeletionResponse>(
        this.apiUrl + 'pendingpartialdeletions/' + pendingPartialDeletionId
      )
      .pipe(this.pendingPartialDeletionDateConverter)
      .toPromise();
  }

  putPendingPartialDeletion(
    pendingPartialDeletionId: number
  ): Promise<PendingPartialDeletionResponse> {
    return this.http
      .put<PendingPartialDeletionResponse>(
        this.apiUrl + 'pendingpartialdeletions/' + pendingPartialDeletionId,
        null
      )
      .pipe(this.pendingPartialDeletionDateConverter)
      .toPromise();
  }

  async deletePendingPartialDeletion(
    pendingPartialDeletionId: number
  ): Promise<void> {
    await this.http
      .delete(
        this.apiUrl + 'pendingpartialdeletions/' + pendingPartialDeletionId
      )
      .toPromise();
  }

  postPendingComplianceChange(postData: object): Promise<object> {
    return this.http
      .post(this.apiUrl + 'pendingcompliancechanges', postData)
      .toPromise();
  }

  getPendingComplianceChange(
    pendingComplianceChangeId: string
  ): Promise<PendingComplianceChange> {
    return this.http
      .get<PendingComplianceChange>(
        this.apiUrl + 'pendingcompliancechanges/' + pendingComplianceChangeId
      )
      .toPromise();
  }

  putPendingComplianceChange(
    pendingComplianceChangeId: string
  ): Promise<object> {
    return this.http
      .put(
        this.apiUrl + 'pendingcompliancechanges/' + pendingComplianceChangeId,
        null
      )
      .toPromise();
  }

  deletePendingComplianceChange(
    pendingComplianceChangeId: number
  ): Promise<object> {
    return this.http
      .delete(
        this.apiUrl + 'pendingcompliancechanges/' + pendingComplianceChangeId
      )
      .toPromise();
  }

  postPendingStudyChange(postData: object): Promise<void> {
    return this.http
      .post<void>(this.apiUrl + 'pendingstudychanges', postData)
      .toPromise();
  }

  putPendingStudyChange(pendingStudyChangeId: string): Promise<void> {
    return this.http
      .put<void>(
        this.apiUrl + 'pendingstudychanges/' + pendingStudyChangeId,
        null
      )
      .toPromise();
  }

  deletePendingStudyChange(pendingStudyChangeId: number): Promise<void> {
    return this.http
      .delete<void>(this.apiUrl + 'pendingstudychanges/' + pendingStudyChangeId)
      .toPromise();
  }

  public deleteProbandAccount(
    pseudonym: string,
    deletionType: ProbandAccountDeletionType
  ): Promise<void> {
    const params = new HttpParams().set('deletionType', deletionType);
    return this.http
      .delete<void>(`${this.apiUrl}probands/${pseudonym}/account`, {
        params,
      })
      .toPromise();
  }
}
