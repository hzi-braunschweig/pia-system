/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, inject } from '@angular/core';
import Keycloak from 'keycloak-js';
import { MatDialog } from '@angular/material/dialog';
import { DialogDeleteAccountHealthDataPermissionComponent } from '../../dialogs/dialog-delete-account-health-data-permission/dialog-delete-account-health-data-permission.component';
import { DialogDeleteAccountConfirmationComponent } from '../../dialogs/dialog-delete-account-confirmation/dialog-delete-account-confirmation.component';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../_services/alert.service';
import { DialogDeleteAccountSuccessComponent } from '../../dialogs/dialog-delete-account-success/dialog-delete-account-success.component';
import { CurrentUser } from '../../_services/current-user.service';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';

type AccountDeletionType = 'full' | 'contact';

@Component({
  templateUrl: 'settings.component.html',
  standalone: false,
})
export class SettingsComponent {
  private readonly keycloak = inject(Keycloak);

  constructor(
    private readonly dialog: MatDialog,
    private readonly authService: AuthService,
    private readonly user: CurrentUser,
    private readonly alertService: AlertService,
    private readonly questionnaireService: QuestionnaireService
  ) {}

  public changePassword(): void {
    this.keycloak.accountManagement();
  }

  public async initiateAccountDeletion(): Promise<void> {
    const study = await this.questionnaireService.getStudy(this.user.study);

    if (study.has_partial_opposition) {
      this.requestKeepHealthDataPermission();
    } else {
      this.requestAccountDeletionConfirmation('full');
    }
  }

  private requestKeepHealthDataPermission(): void {
    this.dialog
      .open(DialogDeleteAccountHealthDataPermissionComponent, {
        width: '500px',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        map((result) => (result === 'agree' ? 'contact' : 'full'))
      )
      .subscribe((deletionType) =>
        this.requestAccountDeletionConfirmation(deletionType)
      );
  }

  private requestAccountDeletionConfirmation(
    deletionType: AccountDeletionType
  ): void {
    this.dialog
      .open<DialogDeleteAccountConfirmationComponent, boolean>(
        DialogDeleteAccountConfirmationComponent,
        {
          width: '500px',
          data: deletionType === 'contact',
        }
      )
      .afterClosed()
      .pipe(filter((result) => result === 'delete'))
      .subscribe(async () => this.deleteAccount(deletionType));
  }

  private async deleteAccount(
    deletionType: AccountDeletionType
  ): Promise<void> {
    try {
      const pseudonym = this.user.username;
      await this.authService.deleteProbandAccount(pseudonym, deletionType);
      this.dialog.open(DialogDeleteAccountSuccessComponent, {
        width: '500px',
        disableClose: true,
      });
      this.keycloak.clearToken();
    } catch (err) {
      this.alertService.errorMessage('SETTINGS.ACCOUNT_DELETION_FAILED');
    }
  }
}
