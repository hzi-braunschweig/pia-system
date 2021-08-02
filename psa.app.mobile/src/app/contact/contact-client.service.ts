/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { StudyContact } from './contact.model';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class ContactClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/questionnaire/';
  }

  constructor(private http: HttpClient, private endpoint: EndpointService) {}

  getStudyAddresses(): Promise<StudyContact[]> {
    return this.http
      .get<StudyContact[]>(this.getApiUrl() + 'studies/addresses')
      .toPromise();
  }
}
