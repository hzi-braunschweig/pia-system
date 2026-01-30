/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import {
  MenuController,
  ViewWillEnter,
  IonContent,
  IonCard,
  IonCardHeader,
} from '@ionic/angular/standalone';
import { LoginUsernameComponent } from '../login-username/login-username.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [IonContent, IonCard, IonCardHeader, LoginUsernameComponent],
})
export class LoginPage implements ViewWillEnter {
  constructor(private menuCtrl: MenuController) {}

  async ionViewWillEnter(): Promise<void> {
    await this.menuCtrl.enable(false);
  }
}
