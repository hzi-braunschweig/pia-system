/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { DeleteAccountModalService } from '../account/services/delete-account-modal.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(
    private deleteAccountModalService: DeleteAccountModalService,
    private auth: AuthService
  ) {}

  public async openDeleteAccountModal(): Promise<void> {
    await this.deleteAccountModalService.showDeleteAccountModal();
  }

  public async openAccountManagement(): Promise<void> {
    await this.auth.openAccountManagement();
  }
}
