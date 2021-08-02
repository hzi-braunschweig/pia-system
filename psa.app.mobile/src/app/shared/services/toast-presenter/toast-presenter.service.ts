/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ToastPresenterService {
  private static readonly DEFAULT_DURATION = 3000;

  constructor(
    private toastCtrl: ToastController,
    private translate: TranslateService
  ) {}

  presentToast(msg, translateParams?: { [key: string]: string }) {
    this.createToast(msg, translateParams).then((toast) => toast.present());
  }

  async createToast(msg, translateParams: { [key: string]: string }) {
    return this.toastCtrl.create({
      message: this.translate.instant(msg, translateParams),
      duration: ToastPresenterService.DEFAULT_DURATION,
      position: 'bottom',
    });
  }
}
