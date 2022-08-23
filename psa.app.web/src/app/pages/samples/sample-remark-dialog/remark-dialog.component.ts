/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-sample-remark-dialog',
  templateUrl: 'remark-dialog.component.html',
})
export class RemarkDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { remark: string }) {}
}
