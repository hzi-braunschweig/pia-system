/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';

import { User } from '../../psa.app.core/models/user';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../_services/alert.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';
import { UserSettings } from 'src/app/psa.app.core/models/user_settings';
import { LoggingManagerService } from '../../_services/logging-manager.service';

@Component({
  templateUrl: 'settings.component.html',
  styleUrls: ['settings.component.scss'],
})
export class SettingsComponent {
  currentUser: User;
  public logging_active = true;

  timepickerTheme: NgxMaterialTimepickerTheme = {
    container: {
      bodyBackgroundColor: '#ffffff',
      buttonColor: '#6d9124',
    },
    dial: {
      dialBackgroundColor: '#6d9124',
    },
    clockFace: {
      clockFaceBackgroundColor: '#7dd4ff',
      clockHandColor: '#307292',
      clockFaceTimeInactiveColor: '#307292',
    },
  };

  constructor(
    private authenticationService: AuthService,
    private alertService: AlertService,
    public snackBar: MatSnackBar,
    private translate: TranslateService,
    private loggingManager: LoggingManagerService
  ) {
    this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
    authenticationService.getUserSettings(this.currentUser.username).then(
      (result: UserSettings) => {
        this.logging_active = result.logging_active;
      },
      (err) => {
        this.alertService.errorObject(err);
      }
    );
  }

  saveSettings(): void {
    const updateData: UserSettings = {
      logging_active: this.logging_active,
    };
    this.authenticationService
      .putUserSettings(this.currentUser.username, updateData)
      .then(
        (result: any) => {
          const message = this.translate.instant('SETTINGS.INFO_SAVED');
          const action = 'Ok';
          this.snackBar.open(message, action, {
            duration: 5000,
          });
          this.loggingManager.loadCurrentUserSettings();
        },
        (err) => {
          this.alertService.errorObject(err);
        }
      );
  }
}
