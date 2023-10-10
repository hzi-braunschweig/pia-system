/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeedbackStatisticClientService } from './services/feedback-statistic-client.service';
import { FeedbackStatisticDto } from '@pia-system/charts';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-feedback-statistics',
  templateUrl: './feedback-statistics.page.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackStatisticsPage {
  public feedbackStatistics: Observable<FeedbackStatisticDto[]> =
    this.feedbackStatisticClientService.getFeedbackStatistics();

  constructor(
    private feedbackStatisticClientService: FeedbackStatisticClientService
  ) {}
}
