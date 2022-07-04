/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-delete-account-confirmation',
  templateUrl: './dialog-delete-account-confirmation.component.html',
})
export class DialogDeleteAccountConfirmationComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public keepHealthData: true) {}
}
