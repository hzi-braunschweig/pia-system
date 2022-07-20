/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { KeycloakClientService } from '../auth/keycloak-client.service';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { DeleteAccountModalService } from '../account/services/delete-account-modal.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage {
  constructor(
    private deleteAccountModalService: DeleteAccountModalService,
    private auth: AuthService,
    private keycloakClient: KeycloakClientService,
    private router: Router
  ) {}

  async openDeleteAccountModal(): Promise<void> {
    await this.deleteAccountModalService.showDeleteAccountModal();
  }

  changePasswort(): void {
    if (this.auth.isLegacyLogin()) {
      this.router.navigate(['..', 'auth', 'change-password'], {
        queryParams: { isUserIntent: true, returnTo: 'settings' },
      });
    } else {
      this.keycloakClient.openAccountManagement();
    }
  }
}
