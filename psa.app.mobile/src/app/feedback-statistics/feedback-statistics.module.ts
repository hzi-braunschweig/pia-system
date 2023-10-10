/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FeedbackStatisticsPageRoutingModule } from './feedback-statistics-routing.module';

import { FeedbackStatisticsPage } from './feedback-statistics.page';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../shared/shared.module';
import { ChartsModule } from '@pia-system/charts';
import { FeedbackStatisticComponent } from './feedback-statistic/feedback-statistic.component';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule.forChild(),
    FeedbackStatisticsPageRoutingModule,
    SharedModule,
    ChartsModule.forChild(),
    MarkdownModule,
  ],
  declarations: [FeedbackStatisticsPage, FeedbackStatisticComponent],
})
export class FeedbackStatisticsPageModule {}
