/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';

@Component({
  selector: 'app-probands-list-action',
  template: `
    <button mat-raised-button color="primary" style="margin-right: 15px;">
      <ng-content></ng-content>
    </button>
  `,
})
export class ProbandsListActionComponent {}
