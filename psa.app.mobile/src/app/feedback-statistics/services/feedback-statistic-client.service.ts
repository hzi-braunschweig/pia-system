/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { FeedbackStatisticDto } from '@pia-system/charts';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class FeedbackStatisticClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/feedbackstatistic/';
  }

  constructor(
    private readonly http: HttpClient,
    private endpoint: EndpointService
  ) {}

  public getFeedbackStatistics(): Observable<FeedbackStatisticDto[]> {
    return this.http.get<FeedbackStatisticDto[]>(this.getApiUrl());
  }

  public async hasFeedbackStatistics(): Promise<boolean> {
    return (await firstValueFrom(this.getFeedbackStatistics())).length > 0;
  }
}
