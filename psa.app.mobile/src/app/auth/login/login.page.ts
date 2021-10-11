/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  LoadingController,
  MenuController,
  Platform,
  ViewWillEnter,
} from '@ionic/angular';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { Market } from '@ionic-native/market/ngx';
import { TranslateService } from '@ngx-translate/core';
import { JwtHelperService } from '@auth0/angular-jwt';

import { LoginPlatform, User } from '../auth.model';
import { AuthClientService } from '../auth-client.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';
import { LocaleService } from '../../shared/services/locale/locale.service';
import { AuthService } from '../auth.service';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements ViewWillEnter {
  username = '';
  password = '';

  showCustomEndpointField = this.endpoint.isCustomEndpoint();
  customEndpointUrl: string = this.showCustomEndpointField
    ? this.endpoint.getUrl()
    : null;

  remainingLoginBlockedTime: string = null;

  private interval;

  private isLoading = false;

  private jwtHelper = new JwtHelperService();
  private loginToken: string = localStorage.getItem('token_login');

  private currentAppVersion: string;

  constructor(
    public localeService: LocaleService,
    public endpoint: EndpointService,
    private platform: Platform,
    private appVersion: AppVersion,
    private market: Market,
    private loadingCtrl: LoadingController,
    private authClient: AuthClientService,
    private auth: AuthService,
    private router: Router,
    private menuCtrl: MenuController,
    private toastPresenter: ToastPresenterService,
    private alertCtrl: AlertController,
    private translate: TranslateService
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.menuCtrl.enable(false);
    this.currentAppVersion = await this.appVersion.getVersionNumber();
  }

  async login() {
    if (this.isLoading) {
      return;
    }

    let username;
    if (this.isLoginTokenValid()) {
      const jwtToken = this.jwtHelper.decodeToken(this.loginToken);
      username = jwtToken.username;
    } else {
      username = this.username;
    }
    if (!this.setEndpoint(username)) {
      return;
    }
    this.auth.resetCurrentUser();

    const loader = await this.showLoader();

    if (!(await this.endpoint.isEndpointCompatible(this.currentAppVersion))) {
      this.dismissLoader(loader);
      await this.showAppIncompatibleAlert();
      return;
    }

    try {
      let result: User;
      if (this.isLoginTokenValid()) {
        result = await this.authClient.loginWithToken({
          logged_in_with: this.getPlatform(),
          username: 'default',
          password: this.password,
          locale: this.localeService.currentLocale,
        });
      } else {
        result = await this.authClient.login({
          logged_in_with: this.getPlatform(),
          username: this.username,
          password: this.password,
          locale: this.localeService.currentLocale,
        });
      }
      this.onLoginSuccess(result);
    } catch (error) {
      this.onLoginError(error.error);
    }
    this.dismissLoader(loader);
  }

  async showRequestPWDialog() {
    if (!this.username && !this.isLoginTokenValid()) {
      this.toastPresenter.presentToast('LOGIN.TOAST_MSG_LOGIN_GIVE_USERNAME');
      return;
    }

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
        const username = this.isLoginTokenValid() ? 'default' : this.username;
        if (username === 'default') {
          // By a 'default' username there will be no backend endpoint set, therefore the username must be
          // retrieved form the token before proceeding.
          const decodedToken = this.jwtHelper.decodeToken(this.loginToken);
          const tokenUsername = decodedToken.username;
          this.setEndpoint(tokenUsername);
        } else {
          this.setEndpoint(username);
        }
        this.authClient
          .requestNewPassword(
            username,
            this.isLoginTokenValid() ? this.loginToken : null
          )
          .then(() =>
            this.toastPresenter.presentToast(
              'LOGIN.TOAST_MSG_NEW_PASSWORD_RESULT'
            )
          );
      }
    });

    alert.present();
  }

  async showAppIncompatibleAlert(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant(
        'LOGIN.ALERT_MSG_INCOMPATIBLE_APP_VERSION'
      ),
      buttons: [
        {
          text: this.translate.instant('GENERAL.CANCEL_TEXT'),
          role: 'cancel',
        },
        {
          text: this.translate.instant(
            'LOGIN.ALERT_BUTTON_LABEL_GO_TO_APP_STORE'
          ),
          handler: () => {
            alert.dismiss();
            this.market.open(this.getAppId());
            return false;
          },
        },
      ],
    });

    alert.present();
  }

  clearLoginToken() {
    localStorage.removeItem('token_login');
    this.loginToken = null;
    this.username = null;
    this.password = '';
  }

  toggleCustomEndpointField() {
    this.showCustomEndpointField = !this.showCustomEndpointField;
    if (!this.showCustomEndpointField) {
      this.customEndpointUrl = null;
      this.endpoint.removeCustomEndpoint();
    }
  }

  isLoginTokenValid(): boolean {
    return (
      this.loginToken &&
      this.loginToken !== 'undefined' &&
      !this.jwtHelper.isTokenExpired(this.loginToken)
    );
  }

  private getPlatform(): LoginPlatform {
    if (this.platform.is('android')) {
      return 'android';
    } else if (this.platform.is('ios')) {
      return 'ios';
    }
    return 'web';
  }

  private setEndpoint(username: string): boolean {
    if (!this.showCustomEndpointField) {
      const success = this.endpoint.setEndpointForUser(username);
      if (!success) {
        this.toastPresenter.presentToast(
          'LOGIN.TOAST_MSG_LOGIN_NO_BACKEND_MAPPING_EXISTS'
        );
      }
      return success;
    } else {
      const success = this.endpoint.setCustomEndpoint(this.customEndpointUrl);
      if (!success) {
        this.toastPresenter.presentToast('LOGIN.GIVEN_BACKEND_URL_NOT_VALID');
      }
      return success;
    }
  }

  private onLoginSuccess(user: User) {
    const decodedToken = this.jwtHelper.decodeToken(user.token);
    if (decodedToken.role !== 'Proband') {
      this.toastPresenter.presentToast('LOGIN.TOAST_MSG_ONLY_PROBANDS_ALLOWED');
      return;
    }
    if (user.token_login) {
      this.loginToken = user.token_login;
      localStorage.setItem('token_login', user.token_login);
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.auth.emitLogin();
    this.router.navigate(['home']);
    this.menuCtrl.enable(true);
  }

  private onLoginError(error) {
    if (error.statusCode === 401) {
      if (this.isLoginTokenValid()) {
        // with loginToken
        this.toastPresenter.presentToast(
          'LOGIN.TOAST_MSG_LOGIN_USERNAME_EMPTY_ERROR'
        );
        this.clearLoginToken();
      } else {
        // without loginToken
        this.toastPresenter.presentToast(
          'LOGIN.TOAST_MSG_LOGIN_NO_USER_EXISTS'
        );
      }
    } else if (
      error.statusCode === 403 &&
      error.details &&
      error.details.remainingTime
    ) {
      let timeLeft = error.details.remainingTime;
      clearInterval(this.interval);
      this.remainingLoginBlockedTime = this.minSec(timeLeft);
      this.interval = setInterval(() => {
        if (timeLeft < 0) {
          this.remainingLoginBlockedTime = null;
          clearInterval(this.interval);
          return;
        }
        timeLeft--;
        this.remainingLoginBlockedTime = this.minSec(timeLeft);
      }, 1000);
    } else if (error.statusCode === 403) {
      this.toastPresenter.presentToast('LOGIN.TOAST_MSG_NO_MATCH_ERROR');
    }
    console.error(error);
  }

  private minSec(t) {
    const minutes = Math.floor(t / 60) % 60;
    t -= minutes * 60;
    const seconds = t % 60;

    return [minutes + ':', seconds >= 10 ? seconds : '0' + seconds].join('');
  }

  private async showLoader() {
    const loading = await this.loadingCtrl.create({
      message: this.translate.instant('LOGIN.AUTHENTICATING'),
    });
    loading.present();
    return loading;
  }

  private dismissLoader(loading: HTMLIonLoadingElement) {
    loading.dismiss();
    this.isLoading = false;
  }

  private getAppId() {
    if (this.platform.is('android')) {
      return environment.androidAppId;
    } else if (this.platform.is('ios')) {
      return environment.iOSAppId;
    } else {
      return null;
    }
  }
}
