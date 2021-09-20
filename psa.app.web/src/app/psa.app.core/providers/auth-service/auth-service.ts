/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  PasswordChangeRequest,
  PasswordChangeResponse,
  User,
  UserWithSameRole,
} from '../../models/user';
import { PlannedProband } from '../../models/plannedProband';
import {
  SormasProband,
  UserListResponse,
  UserWithStudyAccess,
} from '../../models/user-with-study-access';
import { UserSettings } from '../../models/user_settings';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map, pluck } from 'rxjs/operators';
import {
  PendingPartialDeletionRequest,
  PendingPartialDeletionResponse,
} from '../../models/pendingPartialDeletion';
import { PendingComplianceChange } from '../../models/pendingComplianceChange';

@Injectable()
export class AuthService {
  private static pendingPartialDeletionDateConverter = map(
    (deletion: PendingPartialDeletionResponse) => {
      deletion.fromDate = deletion.fromDate
        ? new Date(deletion.fromDate)
        : null;
      deletion.toDate = deletion.toDate ? new Date(deletion.toDate) : null;
      return deletion;
    }
  );

  private readonly apiUrl = 'api/v1/user/';

  constructor(public http: HttpClient) {}

  login(credentials: object): Promise<User> {
    return this.http.post<User>(this.apiUrl + 'login', credentials).toPromise();
  }

  loginWithToken(credentials: object, token: string): Promise<User> {
    const headers = new HttpHeaders().append('Authorization', token);
    return this.http
      .post<User>(this.apiUrl + 'login', credentials, { headers })
      .toPromise();
  }

  requestNewPassword(user_id: string, token: string): Promise<any> {
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.append('Authorization', token);
    }
    return this.http
      .put(
        this.apiUrl + 'newPassword',
        { user_id },
        { headers, responseType: 'text' }
      )
      .toPromise();
  }

  changePassword(
    credentials: PasswordChangeRequest
  ): Promise<PasswordChangeResponse> {
    return this.http
      .post<PasswordChangeResponse>(this.apiUrl + 'changePassword', credentials)
      .toPromise();
  }

  logout(username: string): Promise<any> {
    return this.http.post(this.apiUrl + 'logout', { username }).toPromise();
  }

  getUsers(): Promise<UserListResponse> {
    return this.http.get<UserListResponse>(this.apiUrl + 'users').toPromise();
  }

  getUsersWithSameRole(): Promise<{ users: UserWithSameRole[] }> {
    return this.http
      .get<{ users: UserWithSameRole[] }>(this.apiUrl + 'usersWithSameRole')
      .toPromise();
  }

  getUser(username: string): Promise<User & UserWithStudyAccess> {
    return this.http
      .get<User & UserWithStudyAccess>(this.apiUrl + 'users/' + username)
      .toPromise();
  }

  getUserByIDS(idsOrUuid: string): Promise<User & UserWithStudyAccess> {
    return this.http
      .get<User & UserWithStudyAccess>(this.apiUrl + 'users/ids/' + idsOrUuid)
      .toPromise();
  }

  deleteUser(probandUsername: string, requested_for?: string): Promise<void> {
    const requestUrl = requested_for
      ? this.apiUrl +
        'users/' +
        probandUsername +
        '?requested_for=' +
        requested_for
      : this.apiUrl + 'users/' + probandUsername;
    return this.http.delete<void>(requestUrl).toPromise();
  }

  postUser(postData: object): Promise<UserWithStudyAccess> {
    return this.http
      .post<UserWithStudyAccess>(this.apiUrl + 'users', postData)
      .toPromise();
  }

  postSormasProband(postData: object): Promise<SormasProband> {
    return this.http
      .post<SormasProband>(this.apiUrl + 'sormasProbands', postData)
      .toPromise();
  }

  postProband(postData: object): Promise<User> {
    return this.http.post<User>(this.apiUrl + 'probands', postData).toPromise();
  }

  postIDS(postData: object): Promise<User> {
    return this.http
      .post<User>(this.apiUrl + 'probandsIDS', postData)
      .toPromise();
  }

  putUser(username: string, putData: object): Promise<UserWithStudyAccess> {
    return this.http
      .put<UserWithStudyAccess>(
        this.apiUrl + 'users/' + username,
        JSON.stringify(putData)
      )
      .toPromise();
  }

  putUserSettings(
    username: string,
    putData: UserSettings
  ): Promise<UserSettings> {
    return this.http
      .put<UserSettings>(
        this.apiUrl + 'userSettings/' + username,
        JSON.stringify(putData)
      )
      .toPromise();
  }

  getUserSettings(username: string): Promise<UserSettings> {
    return this.http
      .get<UserSettings>(this.apiUrl + 'userSettings/' + username)
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

  postPendingDeletion(postData: object): Promise<object> {
    return this.http
      .post(this.apiUrl + 'pendingdeletions', postData)
      .toPromise();
  }

  putPendingDeletion(pendingDeletionId: string): Promise<object> {
    return this.http
      .put(this.apiUrl + 'pendingdeletions/' + pendingDeletionId, null)
      .toPromise();
  }

  getPendingDeletion(pendingdeletionId: string): Promise<any> {
    return this.http
      .get(this.apiUrl + 'pendingdeletions/' + pendingdeletionId)
      .toPromise();
  }

  getPendingDeletionForProbandId(probandId: string): Promise<any> {
    return this.http
      .get(this.apiUrl + 'pendingdeletions/proband/' + probandId)
      .toPromise();
  }

  getPendingDeletionForSampleId(sampleId: string): Promise<any> {
    return this.http
      .get(this.apiUrl + 'pendingdeletions/sample/' + sampleId)
      .toPromise();
  }

  deletePendingDeletion(pendingDeletionId: string): Promise<void> {
    return this.http
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
      .pipe(AuthService.pendingPartialDeletionDateConverter)
      .toPromise();
  }

  getPendingPartialDeletion(
    pendingPartialDeletionId: number
  ): Promise<PendingPartialDeletionResponse> {
    return this.http
      .get<PendingPartialDeletionResponse>(
        this.apiUrl + 'pendingpartialdeletions/' + pendingPartialDeletionId
      )
      .pipe(AuthService.pendingPartialDeletionDateConverter)
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
      .pipe(AuthService.pendingPartialDeletionDateConverter)
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

  getPendingComplianceChangeForProband(
    probandId: string
  ): Promise<PendingComplianceChange> {
    return this.http
      .get<PendingComplianceChange>(
        this.apiUrl + 'pendingcompliancechanges/proband/' + probandId
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
}
