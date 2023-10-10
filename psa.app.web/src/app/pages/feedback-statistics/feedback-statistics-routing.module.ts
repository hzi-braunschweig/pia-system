/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { FeedbackStatisticListResearcherComponent } from './feedback-statistic-list-researcher/feedback-statistic-list-researcher.component';
import { FeedbackStatisticConfigurationComponent } from './feedback-statistic-configuration/feedback-statistic-configuration.component';
import { AuthGuard } from '../../_guards/auth.guard';
import { FeedbackStatisticListComponent } from './feedback-statistic-list/feedback-statistic-list.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    data: { authorizedRoles: ['Forscher', 'Proband'] },
    component: FeedbackStatisticListComponent,
  },
  {
    path: 'study/:studyName',
    canActivate: [AuthGuard],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticListResearcherComponent,
  },
  {
    path: 'study/:studyName/edit',
    canActivate: [AuthGuard],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticConfigurationComponent,
  },
  {
    path: 'study/:studyName/edit/:configurationId',
    canActivate: [AuthGuard],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticConfigurationComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeedbackStatisticsRoutingModule {}
