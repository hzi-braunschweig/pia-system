/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Market } from '@awesome-cordova-plugins/market/ngx';
import { environment } from '../../../environments/environment';
import { LocaleService } from '../../shared/services/locale/locale.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';

@Component({
  selector: 'app-login-username',
  templateUrl: './login-username.component.html',
  styleUrls: ['./login-username.component.scss'],
})
export class LoginUsernameComponent implements OnInit {
  @Output()
  public usernameChange = new EventEmitter<string>();

  public readonly form = new FormGroup({
    username: new FormControl('', Validators.required),
    rememberMe: new FormControl(false),
    customEndpointUrl: new FormControl(
      this.endpoint.getCustomEndpoint(),
      Validators.required
    ),
  });

  private loading: HTMLIonLoadingElement;

  public constructor(
    public localeService: LocaleService,
    private endpoint: EndpointService,
    private platform: Platform,
    private appVersion: AppVersion,
    private market: Market,
    private loadingCtrl: LoadingController,
    private auth: AuthService,
    private toastPresenter: ToastPresenterService,
    private alertCtrl: AlertController,
    private translate: TranslateService
  ) {
    if (!this.endpoint.isCustomEndpoint()) {
      this.form.get('customEndpointUrl').disable();
    }
  }

  public async ngOnInit(): Promise<void> {
    const username = this.auth.getRememberedUsername();
    const customEndpointUrl = this.endpoint.getCustomEndpoint();
    await this.setUsernameAndEndpoint(username, customEndpointUrl);
  }

  public async onSubmit(): Promise<void> {
    const username = this.form.get('username').value;
    const customEndpointUrl = this.form.get('customEndpointUrl').value;
    if (this.form.get('rememberMe').value) {
      this.auth.setRememberedUsername(username);
    } else {
      this.auth.setRememberedUsername(null);
    }
    await this.setUsernameAndEndpoint(username, customEndpointUrl);
  }

  private async setUsernameAndEndpoint(
    username: string,
    customEndpointUrl: string
  ): Promise<void> {
    if (!username || this.loading) {
      return;
    }
    if (!this.setEndpoint(username, customEndpointUrl)) {
      return;
    }
    this.auth.resetCurrentUser();

    await this.showLoader('LOGIN.CONNECTING_TO_SERVER');

    if (this.platform.is('cordova')) {
      const currentAppVersion = await this.appVersion
        .getVersionNumber()
        .catch(() => null);
      if (!(await this.endpoint.isEndpointCompatible(currentAppVersion))) {
        await this.dismissLoader();
        await this.showAppIncompatibleAlert();
        return;
      }
    }
    await this.dismissLoader();
    this.usernameChange.next(username);
  }

  private async showAppIncompatibleAlert(): Promise<void> {
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

    await alert.present();
  }

  public toggleCustomEndpointField(): void {
    const customEndpointUrl = this.form.get('customEndpointUrl');
    if (customEndpointUrl.disabled) {
      customEndpointUrl.enable();
    } else {
      customEndpointUrl.setValue(null);
      customEndpointUrl.disable();
      this.endpoint.removeCustomEndpoint();
    }
  }

  private setEndpoint(username: string, customEndpointUrl: string): boolean {
    if (!customEndpointUrl) {
      const success = this.endpoint.setEndpointForUser(username);
      if (!success) {
        this.toastPresenter.presentToast(
          'LOGIN.TOAST_MSG_LOGIN_NO_BACKEND_MAPPING_EXISTS'
        );
      }
      return success;
    } else {
      const success = this.endpoint.setCustomEndpoint(customEndpointUrl);
      if (!success) {
        this.toastPresenter.presentToast('LOGIN.GIVEN_BACKEND_URL_NOT_VALID');
      }
      return success;
    }
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
