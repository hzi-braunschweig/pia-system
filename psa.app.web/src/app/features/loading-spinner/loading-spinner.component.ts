/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: '<mat-spinner class="loading"></mat-spinner>',
  styleUrls: ['./loading-spinner.component.scss'],
})
export class LoadingSpinnerComponent {}
