/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogEditComplianceComponent } from '../compliance-edit-dialog/dialog-edit-compliance.component';
import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';

@Component({
  selector: 'app-compliance-examiner',
  templateUrl: './compliance-examiner.component.html',
})
export class ComplianceExaminerComponent {
  constructor(private readonly dialog: MatDialog) {}

  showCompliance(user: UserWithStudyAccess): void {
    this.dialog.open(DialogEditComplianceComponent, {
      width: '1000px',
      autoFocus: true,
      disableClose: false,
      data: user,
    });
  }
}
