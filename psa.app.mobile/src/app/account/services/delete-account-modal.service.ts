/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Injectable } from '@angular/core';
import { AccountClientService } from './account-client.service';
import { QuestionnaireClientService } from '../../questionnaire/questionnaire-client.service';
import { ModalController } from '@ionic/angular';
import { KeepStudyAnswersModalComponent } from '../components/keep-study-answers-modal/keep-study-answers-modal.component';
import { DeleteAccountModalComponent } from '../components/delete-account-modal/delete-account-modal.component';
import { DeletionType } from './deletion-type.enum';
import { CannotDetermineDeletionTypeError } from './cannot-determine-deletion-type.error';
import { CurrentUser } from '../../auth/current-user.service';

@Injectable({ providedIn: 'root' })
export class DeleteAccountModalService {
  private keepStudyAnswers: boolean = null;

  constructor(
    private currentUser: CurrentUser,
    private accountClientService: AccountClientService,
    private questionnaireClientService: QuestionnaireClientService,
    private modalController: ModalController
  ) {}

  public allowKeepStudyAnswers() {
    this.keepStudyAnswers = true;
  }

  public denyKeepStudyAnswers() {
    this.keepStudyAnswers = false;
  }

  public resetKeepStudyAnswers() {
    this.keepStudyAnswers = null;
  }

  public willDeleteAnswers() {
    if (this.keepStudyAnswers === null) {
      throw new CannotDetermineDeletionTypeError();
    }
    return !this.keepStudyAnswers;
  }

  public getSelectedDeletionType(): DeletionType {
    return this.willDeleteAnswers() ? DeletionType.FULL : DeletionType.CONTACT;
  }

  public async showDeleteAccountModal(): Promise<void> {
    const study = await this.questionnaireClientService.getStudy(
      this.currentUser.study
    );

    if (study.has_partial_opposition && this.keepStudyAnswers === null) {
      const keepStudyAnswersModal = await this.modalController.create({
        component: KeepStudyAnswersModalComponent,
      });
      await keepStudyAnswersModal.present();
    } else {
      if (this.keepStudyAnswers === null) {
        this.denyKeepStudyAnswers();
      }
      const deleteAccountModal = await this.modalController.create({
        component: DeleteAccountModalComponent,
      });
      await deleteAccountModal.present();
    }
  }
}
