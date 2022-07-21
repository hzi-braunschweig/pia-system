/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { LocaleService } from '../../shared/services/locale/locale.service';
import {
  AlertController,
  LoadingController,
  MenuController,
  Platform,
} from '@ionic/angular';
import { AuthService } from '../auth.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';
import { TranslateService } from '@ngx-translate/core';
import { LoginPlatform, LoginResponse } from '../auth.model';
import { AuthClientService } from '../auth-client.service';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-password-legacy',
  templateUrl: './login-password-legacy.component.html',
  styleUrls: ['./login-password-legacy.component.scss'],
})
export class LoginPasswordLegacyComponent {
  public constructor(
    public localeService: LocaleService,
    private platform: Platform,
    private loadingCtrl: LoadingController,
    private authClient: AuthClientService,
    private auth: AuthService,
    private router: Router,
    private menuCtrl: MenuController,
    private toastPresenter: ToastPresenterService,
    private alertCtrl: AlertController,
    private translate: TranslateService
  ) {}

  public readonly form = new FormGroup({ password: new FormControl('') });
  public remainingLoginBlockedTime = 0;
  private updateRemainingLoginBlockedTimeInterval: ReturnType<
    typeof setTimeout
  >;

  @Input()
  public username: string;
  private jwtHelper = new JwtHelperService();

  private loading: HTMLIonLoadingElement;

  public async login(): Promise<void> {
    if (this.loading) {
      return;
    }

    await this.showLoader('LOGIN.AUTHENTICATING');

    try {
      const result = await this.authClient.login({
        logged_in_with: this.getPlatform(),
        username: this.username,
        password: this.form.get('password').value,
        locale: this.localeService.currentLocale,
      });
      await this.onLoginSuccess(result);
    } catch (error) {
      this.onLoginError(error.error);
    }
    await this.dismissLoader();
  }

  public async showRequestPWDialog(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant(
        'LOGIN.TOAST_MSG_NEW_PASSWORD_CONFIRMATION'
      ),
      buttons: [
        {
          text: this.translate.instant('GENERAL.NO'),
          handler: () => {
            alert.dismiss(false);
            return false;
          },
        },
        {
          text: this.translate.instant('GENERAL.YES'),
          handler: () => {
            alert.dismiss(true);
            return false;
          },
        },
      ],
    });

    alert.onDidDismiss().then(({ data }) => {
      if (data === true) {
        this.authClient
          .requestNewPassword(this.username)
          .then(() =>
            this.toastPresenter.presentToast(
              'LOGIN.TOAST_MSG_NEW_PASSWORD_RESULT'
            )
          );
      }
    });

    await alert.present();
  }

  private getPlatform(): LoginPlatform {
    if (this.platform.is('android')) {
      return 'android';
    } else if (this.platform.is('ios')) {
      return 'ios';
    }
    return 'web';
  }

  private async onLoginSuccess(user: LoginResponse): Promise<void> {
    const decodedToken = this.jwtHelper.decodeToken(user.token);
    if (decodedToken.role !== 'Proband') {
      this.toastPresenter.presentToast('LOGIN.TOAST_MSG_ONLY_PROBANDS_ALLOWED');
      return;
    }
    this.auth.handleLegacyLoginResponse(user);
    await this.router.navigate(['home']);
    await this.menuCtrl.enable(true);
  }

  private onLoginError(error): void {
    if (error.statusCode === 401) {
      this.toastPresenter.presentToast('LOGIN.TOAST_MSG_LOGIN_NO_USER_EXISTS');
    } else if (
      error.statusCode === 403 &&
      error.details &&
      error.details.remainingTime
    ) {
      this.form.get('password').disable();
      this.remainingLoginBlockedTime = error.details.remainingTime;
      clearInterval(this.updateRemainingLoginBlockedTimeInterval);
      this.updateRemainingLoginBlockedTimeInterval = setInterval(() => {
        this.remainingLoginBlockedTime--;
        if (this.remainingLoginBlockedTime <= 0) {
          clearInterval(this.updateRemainingLoginBlockedTimeInterval);
          this.form.get('password').enable();
        }
      }, 1000);
    } else if (error.statusCode === 403) {
      this.toastPresenter.presentToast('LOGIN.TOAST_MSG_NO_MATCH_ERROR');
    }
    console.error(error);
  }

  private async showLoader(message: string): Promise<void> {
    if (this.loading) {
      return;
    }
    this.loading = await this.loadingCtrl.create({
      message: this.translate.instant(message),
    });
    await this.loading.present();
  }

  private async dismissLoader() {
    await this.loading.dismiss();
    this.loading = null;
  }
}
