/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogDeleteAccountHealthDataPermissionComponent } from '../../dialogs/dialog-delete-account-health-data-permission/dialog-delete-account-health-data-permission.component';
import { DialogDeleteAccountConfirmationComponent } from '../../dialogs/dialog-delete-account-confirmation/dialog-delete-account-confirmation.component';
import { filter, map } from 'rxjs/operators';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { AuthenticationManager } from '../../_services/authentication-manager.service';
import { AlertService } from '../../_services/alert.service';
import { DialogDeleteAccountSuccessComponent } from '../../dialogs/dialog-delete-account-success/dialog-delete-account-success.component';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';

type AccountDeletionType = 'full' | 'contact';

@Component({
  templateUrl: 'settings.component.html',
})
export class SettingsComponent {
  constructor(
    private dialog: MatDialog,
    private authService: AuthService,
    private authManager: AuthenticationManager,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService
  ) {}

  public async initiateAccountDeletion(): Promise<void> {
    const study = await this.questionnaireService.getStudy(
      this.authManager.getCurrentStudy()
    );

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
      .subscribe(() => this.deleteAccount(deletionType));
  }

  private async deleteAccount(
    deletionType: AccountDeletionType
  ): Promise<void> {
    try {
      const pseudonym = this.authManager.getCurrentUsername();
      await this.authService.deleteProbandAccount(pseudonym, deletionType);
      this.dialog.open(DialogDeleteAccountSuccessComponent, {
        width: '500px',
        disableClose: true,
      });
    } catch (err) {
      this.alertService.errorMessage('SETTINGS.ACCOUNT_DELETION_FAILED');
    }
  }
}
