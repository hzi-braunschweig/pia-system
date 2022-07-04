/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';

@Component({
  selector: 'app-keep-study-answers-modal',
  templateUrl: './keep-study-answers-modal.component.html',
  styles: [],
})
export class KeepStudyAnswersModalComponent {
  constructor(
    private modalController: ModalController,
    private deleteAccountModalService: DeleteAccountModalService
  ) {}

  allow(): void {
    this.dismiss();
    this.deleteAccountModalService.allowKeepStudyAnswers();
    this.deleteAccountModalService.showDeleteAccountModal();
  }

  deny(): void {
    this.dismiss();
    this.deleteAccountModalService.denyKeepStudyAnswers();
    this.deleteAccountModalService.showDeleteAccountModal();
  }

  dismiss(): void {
    this.deleteAccountModalService.resetKeepStudyAnswers();
    this.modalController.dismiss();
  }
}
