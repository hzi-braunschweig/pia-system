/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import {
  AlertController,
  LoadingController,
  MenuController,
  Platform,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Market } from '@awesome-cordova-plugins/market/ngx';
import { environment } from '../../../environments/environment';
import { LocaleService } from '../../shared/services/locale/locale.service';
import { ToastPresenterService } from '../../shared/services/toast-presenter/toast-presenter.service';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

class EndpointNotCompatibleError extends Error {
  constructor() {
    super('Endpoint is not compatible');
  }
}

class MissingBackendMappingError extends Error {
  constructor() {
    super('Missing backend mapping');
  }
}

class EndpointUrlInvalidError extends Error {
  constructor() {
    super('Endpoint URL is invalid');
  }
}

@Component({
  selector: 'app-login-username',
  templateUrl: './login-username.component.html',
  styleUrls: ['./login-username.component.scss'],
})
export class LoginUsernameComponent {
  public readonly form = new FormGroup({
    username: new FormControl('', Validators.required),
    customEndpointUrl: new FormControl(
      {
        value: this.endpoint.getCustomEndpointUrl(),
        disabled: !this.endpoint.isCustomEndpoint(),
      },
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
    private translate: TranslateService,
    private router: Router,
    private menuCtrl: MenuController
  ) {}

  public toggleCustomEndpointField(): void {
    const customEndpointUrl = this.form.get('customEndpointUrl');
    if (customEndpointUrl.disabled) {
      customEndpointUrl.enable();
    } else {
      customEndpointUrl.setValue(null);
      customEndpointUrl.disable();
      this.endpoint.removeLatestEndpoint();
    }
  }

  public async onSubmit(): Promise<void> {
    const username = this.form.get('username').value;

    if (!username || this.loading) {
      return;
    }

    try {
      await this.showLoader('LOGIN.CONNECTING_TO_SERVER');

      await this.setEndpoint(
        username,
        this.form.get('customEndpointUrl').value
      );

      await this.authenticateWithKeycloak(username);

      await this.dismissLoader();
    } catch (e) {
      await this.dismissLoader();

      if (e instanceof EndpointNotCompatibleError) {
        await this.showAppIncompatibleAlert();
      } else if (e instanceof MissingBackendMappingError) {
        this.toastPresenter.presentToast(
          'LOGIN.TOAST_MSG_LOGIN_NO_BACKEND_MAPPING_EXISTS'
        );
      } else if (e instanceof EndpointUrlInvalidError) {
        this.toastPresenter.presentToast('LOGIN.GIVEN_BACKEND_URL_NOT_VALID');
      }
    }
  }

  private async setEndpoint(
    username: string,
    customEndpointUrl: string
  ): Promise<void> {
    if (!customEndpointUrl) {
      const success = this.endpoint.setEndpointForUser(username);
      if (!success) {
        throw new MissingBackendMappingError();
      }
    } else {
      const success = this.endpoint.setCustomEndpoint(customEndpointUrl);
      if (!success) {
        throw new EndpointUrlInvalidError();
      }
    }

    if (this.platform.is('cordova')) {
      const currentAppVersion = await this.appVersion
        .getVersionNumber()
        .catch(() => null);
      if (!(await this.endpoint.isEndpointCompatible(currentAppVersion))) {
        throw new EndpointNotCompatibleError();
      }
    }
  }

  private async authenticateWithKeycloak(username: string): Promise<void> {
    try {
      await this.auth.loginWithUsername(
        username,
        this.localeService.currentLocale
      );

      await this.router.navigate(['home']);
      await this.menuCtrl.enable(true);
    } catch (e) {
      if (e?.message !== 'closed_by_user') {
        console.error('Authentication failed with: ', e);

        const alert = await this.alertCtrl.create({
          header: this.translate.instant('LOGIN.ALERT_TRY_AGAIN_LATER'),
          buttons: [
            {
              text: this.translate.instant('GENERAL.OK'),
            },
          ],
        });

        await alert.present();
      }
    }
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
