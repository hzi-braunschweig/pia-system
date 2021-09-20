/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { User } from '../../models/user';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { Proband } from '../../models/proband';

@Injectable()
export class ProbandService {
  private readonly apiUrl = 'api/v1/user/';

  constructor(public http: HttpClient, private auth: AuthenticationManager) {}

  /**
   * Get a list of all probands of a study
   */
  getProbandsByStudy(studyName: string): Promise<Proband[]> {
    return this.http
      .get<Proband[]>(`${this.apiUrl}studies/${studyName}/probands`)
      .toPromise();
  }

  /**
   * Get probands that need to be contacted
   * @return a list of probands info
   */
  getProbandsToContact(): any {
    return new Promise((resolve, reject) => {
      const currentUser: User = this.auth.currentUser;
      const headers = new HttpHeaders({ Authorization: currentUser.token });
      this.http.get(this.apiUrl + `probandstocontact`, { headers }).subscribe(
        (res) => {
          resolve(res);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  putProbandToContact(id: number, putData: object): Promise<object> {
    return new Promise((resolve, reject) => {
      const currentUser: User = this.auth.currentUser;
      const headers = new HttpHeaders({ Authorization: currentUser.token });
      this.http
        .put(this.apiUrl + 'probandstocontact/' + id, putData, {
          headers,
        })
        .subscribe(
          (res) => {
            resolve(res);
          },
          (err) => {
            reject(err);
          }
        );
    });
  }
}
