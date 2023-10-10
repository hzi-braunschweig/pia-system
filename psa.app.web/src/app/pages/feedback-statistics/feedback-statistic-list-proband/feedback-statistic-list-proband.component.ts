/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { FeedbackStatisticsService } from '../feedback-statistics.service';
import { FeedbackStatisticDto } from '@pia-system/charts';

@Component({
  selector: 'app-feedback-statistic-list-proband',
  templateUrl: './feedback-statistic-list-proband.component.html',
})
export class FeedbackStatisticListProbandComponent {
  public isLoading = false;

  public feedbackStatistics: Observable<FeedbackStatisticDto[]>;

  constructor(
    private readonly feedbackStatisticsService: FeedbackStatisticsService
  ) {
    this.isLoading = true;
    this.feedbackStatistics = this.feedbackStatisticsService
      .getFeedbackStatisticsForProband()
      .pipe(finalize(() => (this.isLoading = false)));
  }
}
