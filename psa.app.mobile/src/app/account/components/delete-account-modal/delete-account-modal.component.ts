/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { AccountClientService } from '../../services/account-client.service';
import { AuthService } from '../../../auth/auth.service';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-delete-account-modal',
  templateUrl: './delete-account-modal.component.html',
  styles: [],
})
export class DeleteAccountModalComponent {
  public readonly willDeleteAnswers: boolean =
    this.deleteAccountModalService.willDeleteAnswers();

  constructor(
    private modalController: ModalController,
    private accountClientService: AccountClientService,
    private deleteAccountModalService: DeleteAccountModalService,
    private alertController: AlertController,
    private authService: AuthService,
    private translateService: TranslateService
  ) {}

  async delete() {
    const username = this.authService.getCurrentUser().username;

    try {
      await this.accountClientService.deleteAccount(
        username,
        this.deleteAccountModalService.getSelectedDeletionType()
      );
      await this.presentLogoutAlert();
    } catch (e) {
      await this.presentErrorAlert();
    }
  }

  dismiss() {
    this.deleteAccountModalService.resetKeepStudyAnswers();
    this.modalController.dismiss();
  }

  private async presentLogoutAlert(): Promise<void> {
    const text = this.translateService.instant('DELETE_ACCOUNT.TEXT_CONFIRM');
    const buttonLabel = this.translateService.instant(
      'DELETE_ACCOUNT.BUTTON_LOGOUT'
    );

    await this.presentAlert(text, buttonLabel, () => {
      this.dismiss();
      this.authService.logout();
    });
  }

  private async presentErrorAlert(): Promise<void> {
    const text = this.translateService.instant('DELETE_ACCOUNT.TEXT_ERROR');
    const buttonLabel = this.translateService.instant('GENERAL.CLOSE');

    await this.presentAlert(text, buttonLabel, () => {
      this.dismiss();
    });
  }

  private async presentAlert(
    text: string,
    buttonLabel: string,
    buttonHandler: () => void
  ): Promise<void> {
    const alert = await this.alertController.create({
      header: text,
      buttons: [
        {
          text: buttonLabel,
          handler: buttonHandler,
        },
      ],
    });

    await alert.present();
  }
}
