/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { NotificationClientService } from './notification-client.service';
import { NotificationDto } from './notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationPresenterService {
  constructor(
    private notificationClient: NotificationClientService,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private router: Router
  ) {}

  async present(notificationId: string) {
    try {
      const notification = await this.notificationClient.getNotificationById(
        notificationId
      );

      switch (notification.notification_type) {
        case 'qReminder': {
          await this.showAlert(notification, [
            'questionnaire',
            notification.reference_id,
          ]);
          break;
        }
        case 'sample': {
          await this.showAlert(notification, [
            'lab-result',
            notification.reference_id,
          ]);
          break;
        }
        case 'custom': {
          await this.showAlert(notification);
          break;
        }
        default: {
          console.log(`Invalid choice of notification's type`);
          break;
        }
      }
    } catch (error) {
      console.error(JSON.stringify(error));
    }
  }

  private async showAlert(
    notification: NotificationDto,
    navigateTo: string[] = null
  ) {
    const alertOptions = {
      header: notification.title,
      message: notification.body,
      buttons: [
        {
          text: this.translate.instant('GENERAL.CLOSE'),
          role: 'cancel',
          handler: () => {},
        },
      ],
    };
    if (navigateTo) {
      alertOptions.buttons.push({
        text: this.translate.instant('GENERAL.OPEN'),
        role: undefined,
        handler: () => this.router.navigate(navigateTo),
      });
    }
    (await this.alertCtrl.create(alertOptions)).present();
  }
}
