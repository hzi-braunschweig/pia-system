/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { CurrentUser } from '../../../_services/current-user.service';

@Component({
  selector: 'app-feedback-statistic-list',
  template: `<app-feedback-statistic-list-proband
      data-unit="feedback-statistic-list-proband"
      *ngIf="currentUser.isProband()"
    ></app-feedback-statistic-list-proband>
    <app-feedback-statistic-list-researcher
      data-unit="feedback-statistic-list-researcher"
      *ngIf="currentUser.isProfessional()"
    ></app-feedback-statistic-list-researcher>`,
})
export class FeedbackStatisticListComponent {
  constructor(public readonly currentUser: CurrentUser) {}
}
