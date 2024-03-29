/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-compliance-view-list-entry',
  template: `<div fxLayout="row" unit-list-entry>
    <div fxFlex="50" unit-list-entry-name>{{ name }}</div>
    <div fxFlex="50" *ngIf="isChecked">
      <mat-icon color="primary">check_circle</mat-icon>
    </div>
    <div fxFlex="50" *ngIf="!isChecked">
      <mat-icon color="warn">cancel</mat-icon>
    </div>
  </div>`,
})
export class ComplianceViewListEntryComponent {
  @Input()
  name: string;

  @Input()
  isChecked: boolean;
}
