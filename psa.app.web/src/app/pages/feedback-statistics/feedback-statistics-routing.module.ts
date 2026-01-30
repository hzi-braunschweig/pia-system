/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { FeedbackStatisticListResearcherComponent } from './feedback-statistic-list-researcher/feedback-statistic-list-researcher.component';
import { FeedbackStatisticConfigurationComponent } from './feedback-statistic-configuration/feedback-statistic-configuration.component';
import { FeedbackStatisticListComponent } from './feedback-statistic-list/feedback-statistic-list.component';
import { canActivateAuthRole } from 'src/app/_guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [canActivateAuthRole],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticListComponent,
  },
  {
    path: 'study/:studyName',
    canActivate: [canActivateAuthRole],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticListResearcherComponent,
  },
  {
    path: 'study/:studyName/edit',
    canActivate: [canActivateAuthRole],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticConfigurationComponent,
  },
  {
    path: 'study/:studyName/edit/:configurationId',
    canActivate: [canActivateAuthRole],
    data: { authorizedRoles: ['Forscher'] },
    component: FeedbackStatisticConfigurationComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeedbackStatisticsRoutingModule {}
