/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserWithStudyAccess } from '../../../psa.app.core/models/user-with-study-access';

@Component({
  selector: 'app-dialog-edit-compliance',
  templateUrl: './dialog-edit-compliance.component.html',
})
export class DialogEditComplianceComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly user: UserWithStudyAccess,
    public readonly dialogRef: MatDialogRef<DialogEditComplianceComponent>
  ) {}
}
