/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonText,
  IonButton,
} from '@ionic/angular/standalone';
import { DeleteAccountModalService } from '../../services/delete-account-modal.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-keep-study-answers-modal',
  templateUrl: './keep-study-answers-modal.component.html',
  styles: [],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonText,
    IonButton,
    TranslateModule,
  ],
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
