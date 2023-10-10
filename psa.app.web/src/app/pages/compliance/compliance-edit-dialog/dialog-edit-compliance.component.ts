/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { Proband } from '../../../psa.app.core/models/proband';

@Component({
  selector: 'app-dialog-edit-compliance',
  templateUrl: './dialog-edit-compliance.component.html',
})
export class DialogEditComplianceComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA)
    public readonly user: Proband,
    public readonly dialogRef: MatDialogRef<DialogEditComplianceComponent>
  ) {}
}
