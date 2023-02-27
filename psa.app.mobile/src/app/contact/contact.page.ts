/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { ContactClientService } from './contact-client.service';
import { StudyContact } from './contact.model';
import { MaterialClientService } from './material-client.service';
import { ComplianceService } from '../compliance/compliance-service/compliance.service';
import { ComplianceType } from '../compliance/compliance.model';
import { CurrentUser } from '../auth/current-user.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
})
export class ContactPage implements OnInit {
  public hasSamplesCompliance: boolean;

  public addresses: StudyContact[] = null;

  constructor(
    private currentUser: CurrentUser,
    private contactClient: ContactClientService,
    private materialClient: MaterialClientService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private toastPresenter: ToastPresenterService,
    private complianceService: ComplianceService
  ) {}

  async ngOnInit() {
    try {
      this.hasSamplesCompliance =
        await this.complianceService.userHasCompliances([
          ComplianceType.SAMPLES,
        ]);
      this.addresses = await this.contactClient.getStudyAddresses();
    } catch (error) {
      console.error(error);
    }
  }

  async presentConfirmNewMaterial() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('STUDY_CONTACT.NEW_NASAL_SWAB'),
      message: this.translate.instant('STUDY_CONTACT.CONFIRMATION_MSG1'),
      buttons: [
        {
          text: this.translate.instant('GENERAL.CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('GENERAL.OK'),
          handler: () => {
            this.onRequestNewMaterial();
          },
        },
      ],
    });
    alert.present();
  }

  async onRequestNewMaterial() {
    try {
      await this.materialClient.requestMaterial(this.currentUser.username);
      this.toastPresenter.presentToast(
        'STUDY_CONTACT.TOAST_MSG_NEW_SET_REQUESTED'
      );
    } catch (error) {
      console.error(error);
    }
  }
}
