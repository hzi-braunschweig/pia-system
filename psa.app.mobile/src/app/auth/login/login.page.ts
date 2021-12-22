/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { MenuController, ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements ViewWillEnter {
  public username = '';

  constructor(private menuCtrl: MenuController, private auth: AuthService) {}

  async ionViewWillEnter(): Promise<void> {
    await this.menuCtrl.enable(false);
  }

  public switchUser(): void {
    this.auth.removeRememberedUsername();
    this.username = '';
  }
}
