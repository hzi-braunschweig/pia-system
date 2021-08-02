/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { QuestionnaireListPage } from './questionnaire-list/questionnaire-list.page';
import { QuestionnaireDetailPage } from './questionnaire-detail/questionnaire-detail.page';

const routes: Routes = [
  {
    path: '',
    component: QuestionnaireListPage,
  },
  {
    path: ':questionnaireInstanceId',
    component: QuestionnaireDetailPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class QuestionnairePageRoutingModule {}
