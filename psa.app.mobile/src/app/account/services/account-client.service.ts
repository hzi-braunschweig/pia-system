/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { firstValueFrom } from 'rxjs';
import { DeletionType } from './deletion-type.enum';

@Injectable({
  providedIn: 'root',
})
export class AccountClientService {
  constructor(private http: HttpClient, private endpoint: EndpointService) {}

  deleteAccount(pseudonym: string, deletionType: DeletionType): Promise<void> {
    return firstValueFrom(
      this.http.delete<void>(
        `${this.endpoint.getUrl()}/api/v1/user/probands/${pseudonym}/account?deletionType=${deletionType}`
      )
    );
  }
}
