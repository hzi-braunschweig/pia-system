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
  notificationTime = '17:00';
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
      this.notificationTime =
        result.notification_time != null
          ? this.getTimeFromUTC(result.notification_time.substring(0, 5))
          : '17:00';
      this.loggingActive = result.logging_active;
    } catch (error) {
      console.error(error);
    }
  }

  async saveSettings() {
    const updateData: UserSettings = {
      notification_time: this.getUTCTime(this.notificationTime),
      logging_active: this.loggingActive,
    };
    try {
      const result = await this.settingsClient.putUserSettings(
        this.currentUser.username,
        updateData
      );
      this.notificationTime = this.getTimeFromUTC(
        result.notification_time.substring(0, 5)
      );
      this.toastPresenter.presentToast('SETTINGS.TOAST_MSG_SUCCESSFULLY_SENT');
    } catch (error) {
      console.error(error);
    }
  }

  getUTCTime(time: string) {
    const date = new Date(Date.now());
    const selectedTimeWithOffset = time.split(':');
    const hour = Number(selectedTimeWithOffset[0]);

    date.setHours(hour);
    const utcHour = date.getUTCHours();
    let utcHourString = utcHour.toString();

    if (utcHour < 10) {
      utcHourString = '0' + utcHourString;
    }

    return `${utcHourString}:${selectedTimeWithOffset[1]}`;
  }

  getTimeFromUTC(time: string) {
    const date = new Date(Date.now());
    const selectedTimeWithOffset = time.split(':');
    const hour = Number(selectedTimeWithOffset[0]);

    date.setUTCHours(hour);
    const H = date.getHours();
    let hourString = H.toString();

    if (H < 10) {
      hourString = '0' + hourString;
    }
    return `${hourString}:${selectedTimeWithOffset[1]}`;
  }
}
