import { Component, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from '../auth/auth.service';
import { User } from '../auth/auth.model';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';
import { ContactClientService } from './contact-client.service';
import { StudyContact } from './contact.model';
import { MaterialClientService } from './material-client.service';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.page.html',
})
export class ContactPage implements OnInit {
  currentUser: User = this.auth.getCurrentUser();

  addresses: StudyContact[] = null;

  constructor(
    private auth: AuthService,
    private contactClient: ContactClientService,
    private materialClient: MaterialClientService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private toastPresenter: ToastPresenterService
  ) {}

  async ngOnInit() {
    try {
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
