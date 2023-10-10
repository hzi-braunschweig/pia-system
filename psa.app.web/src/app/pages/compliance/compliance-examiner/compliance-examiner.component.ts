/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { DialogEditComplianceComponent } from '../compliance-edit-dialog/dialog-edit-compliance.component';
import { Proband } from '../../../psa.app.core/models/proband';

@Component({
  selector: 'app-compliance-examiner',
  templateUrl: './compliance-examiner.component.html',
})
export class ComplianceExaminerComponent {
  isLoading = false;

  constructor(private readonly dialog: MatDialog) {}

  showCompliance(user: Proband): void {
    this.dialog.open(DialogEditComplianceComponent, {
      width: '1000px',
      autoFocus: true,
      disableClose: false,
      data: user,
    });
  }
}
