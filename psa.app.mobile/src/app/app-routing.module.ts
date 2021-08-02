/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';
import { ComplianceType } from './compliance/compliance.model';
import { ComplianceGuard } from './compliance/compliance.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    canActivate: [AuthGuard, ComplianceGuard],
    loadChildren: () =>
      import('./home/home.module').then((m) => m.HomePageModule),
  },
  {
    path: 'questionnaire',
    canActivate: [AuthGuard, ComplianceGuard],
    loadChildren: () =>
      import('./questionnaire/questionnaire.module').then(
        (m) => m.QuestionnaireModule
      ),
  },
  {
    path: 'lab-result',
    canActivate: [AuthGuard, ComplianceGuard],
    data: { requiresCompliance: [ComplianceType.LABRESULTS] },
    loadChildren: () =>
      import('./lab-result/lab-result.module').then((m) => m.LabResultModule),
  },
  {
    path: 'compliance',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./compliance/compliance.page.module').then(
        (m) => m.CompliancePageModule
      ),
  },
  {
    path: 'settings',
    canActivate: [AuthGuard, ComplianceGuard],
    loadChildren: () =>
      import('./settings/settings.module').then((m) => m.SettingsPageModule),
  },
  {
    path: 'contact',
    canActivate: [AuthGuard, ComplianceGuard],
    loadChildren: () =>
      import('./contact/contact.module').then((m) => m.ContactPageModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
