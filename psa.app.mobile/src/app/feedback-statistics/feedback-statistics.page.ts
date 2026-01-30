/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeedbackStatisticClientService } from './services/feedback-statistic-client.service';
import { FeedbackStatisticDto } from '@pia-system/charts';
import { Observable } from 'rxjs';
import { HeaderComponent } from '../shared/components/header/header.component';
import { IonContent, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { NgFor, NgIf, AsyncPipe } from '@angular/common';
import { FeedbackStatisticComponent } from './feedback-statistic/feedback-statistic.component';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-feedback-statistics',
  templateUrl: './feedback-statistics.page.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    IonContent,
    NgFor,
    FeedbackStatisticComponent,
    NgIf,
    IonCard,
    IonCardContent,
    AsyncPipe,
    TranslateModule,
  ],
})
export class FeedbackStatisticsPage {
  public feedbackStatistics: Observable<FeedbackStatisticDto[]> =
    this.feedbackStatisticClientService.getFeedbackStatistics();

  constructor(
    private feedbackStatisticClientService: FeedbackStatisticClientService
  ) {}
}
