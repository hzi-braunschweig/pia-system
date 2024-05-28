/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClientDto, CreateApiClientRequestDto } from './api-client.model';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PublicApiService {
  private readonly apiUrl = 'api/v1/publicapi';

  constructor(private readonly http: HttpClient) {}

  public getApiClients(): Observable<ApiClientDto[]> {
    return this.http.get<ApiClientDto[]>(`${this.apiUrl}/clients`);
  }

  public createApiClient(
    apiClient: CreateApiClientRequestDto
  ): Observable<ApiClientDto> {
    return this.http.post<ApiClientDto>(`${this.apiUrl}/clients`, apiClient);
  }

  public deleteApiClient(clientId: string): Observable<ApiClientDto> {
    return this.http.delete<ApiClientDto>(`${this.apiUrl}/clients/${clientId}`);
  }
}
