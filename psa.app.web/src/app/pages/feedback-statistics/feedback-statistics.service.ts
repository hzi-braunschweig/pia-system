/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { FeedbackStatisticConfigurationDto } from './feedback-statistic-configuration/feedback-statistic-configuration.model';
import { HttpClient } from '@angular/common/http';
import { FeedbackStatisticDto } from '@pia-system/charts';

@Injectable({
  providedIn: 'root',
})
export class FeedbackStatisticsService {
  private readonly apiUrl = 'api/v1/feedbackstatistic';

  constructor(private readonly http: HttpClient) {}

  public getFeedbackStatisticsForProband(): Observable<FeedbackStatisticDto[]> {
    return this.http.get<FeedbackStatisticDto[]>(`${this.apiUrl}/`);
  }

  public async hasFeedbackStatisticsForProband(): Promise<boolean> {
    return (
      (await firstValueFrom(this.getFeedbackStatisticsForProband())).length > 0
    );
  }

  public getFeedbackStatisticsForResearcher(
    studyName: string
  ): Observable<FeedbackStatisticDto[]> {
    return this.http.get<FeedbackStatisticDto[]>(
      `${this.apiUrl}/studies/${studyName}`
    );
  }

  public getFeedbackStatisticConfiguration(
    configurationId: number,
    studyName: string
  ): Observable<FeedbackStatisticConfigurationDto> {
    return this.http.get<FeedbackStatisticConfigurationDto>(
      `${this.apiUrl}/studies/${studyName}/configuration/${configurationId}`
    );
  }

  public postFeedbackStatisticConfiguration(
    configuration: FeedbackStatisticConfigurationDto
  ): Observable<FeedbackStatisticConfigurationDto> {
    return this.http.post<FeedbackStatisticConfigurationDto>(
      `${this.apiUrl}/studies/${configuration.study}/configuration`,
      configuration
    );
  }

  public putFeedbackStatisticConfiguration(
    configuration: FeedbackStatisticConfigurationDto
  ): Observable<FeedbackStatisticConfigurationDto> {
    return this.http.put<FeedbackStatisticConfigurationDto>(
      `${this.apiUrl}/studies/${configuration.study}/configuration/${configuration.id}`,
      configuration
    );
  }

  public deleteFeedbackStatisticConfiguration(
    configurationId: number,
    studyName: string
  ): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/studies/${studyName}/configuration/${configurationId}`
    );
  }
}
