/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';

import { SettingsClientService } from './settings-client.service';
import { UserSettings } from './settings.model';
import { AuthService } from '../auth/auth.service';
import { ToastPresenterService } from '../shared/services/toast-presenter/toast-presenter.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
})
export class SettingsPage implements OnInit {
  currentUser = this.auth.getCurrentUser();
  loggingActive = true;

  constructor(
    private settingsClient: SettingsClientService,
    private auth: AuthService,
    private toastPresenter: ToastPresenterService
  ) {}

  async ngOnInit() {
    try {
      const result = await this.settingsClient.getUserSettings(
        this.currentUser.username
      );
      this.loggingActive = result.logging_active;
    } catch (error) {
      console.error(error);
    }
  }

  async saveSettings() {
    const updateData: UserSettings = {
      logging_active: this.loggingActive,
    };
    try {
      const result = await this.settingsClient.putUserSettings(
        this.currentUser.username,
        updateData
      );
      this.toastPresenter.presentToast('SETTINGS.TOAST_MSG_SUCCESSFULLY_SENT');
    } catch (error) {
      console.error(error);
    }
  }
}
