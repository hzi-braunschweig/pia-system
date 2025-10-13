/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewEncapsulation } from '@angular/core';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from './auth/auth.service';
import { ComplianceType } from './compliance/compliance.model';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { BadgeService } from './shared/services/badge/badge.service';
import { CurrentUser } from './auth/current-user.service';
import { filter } from 'rxjs/operators';
import { register } from 'swiper/element/bundle';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

interface AppPage {
  title: string;
  url: string;
  icon: string;
  isShown: boolean;
}

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class AppComponent {
  public appPages: AppPage[] = [];

  public piaVersion: string;

  constructor(
    private platform: Platform,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private compliance: ComplianceService,
    private notification: NotificationService,
    private endpoint: EndpointService,
    private badgeService: BadgeService,
    private currentUser: CurrentUser,
    private auth: AuthService
  ) {
    void this.onAppStart();
    this.compliance.complianceDataChangesObservable.subscribe(() =>
      this.onComplianceChanges()
    );
    this.platform.ready().then(() => this.onPlatformReady());
    this.auth.isAuthenticated$
      .pipe(filter(Boolean))
      .subscribe(async () => await this.onLogin());
  }

  public async logout() {
    await this.presentConfirmLogout();
  }

  /**
   * Executed once at app start
   */
  private async onAppStart() {
    if (this.auth.isAuthenticated()) {
      await this.setupSideMenu();
    }
  }

  private async onLogin() {
    await this.setupSideMenu();

    await this.notification.initPushNotifications(this.currentUser.username);
  }

  /**
   * Executed as soon as user saves compliance data
   */
  private onComplianceChanges() {
    this.setupSideMenu();
  }

  /**
   * Executed as soon as capacitor is ready and plugins may be used
   */
  private async onPlatformReady() {
    if (this.auth.isAuthenticated()) {
      await this.notification.initPushNotifications(this.currentUser.username);
    }

    if (this.platform.is('hybrid')) {
      this.styleStatusBar();
      SplashScreen.hide();
      this.piaVersion = (await App.getInfo()).version;
    }
  }

  private async presentConfirmLogout() {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('APP.CONFIRM_LOGOUT_TITLE'),
      message: this.translate.instant('APP.CONFIRM_LOGOUT_MSG'),
      buttons: [
        {
          text: this.translate.instant('GENERAL.CANCEL'),
          role: 'cancel',
        },
        {
          text: this.translate.instant('GENERAL.OK'),
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: this.translate.instant('APP.LOGGING_OUT'),
            });
            await loading.present();
            await this.auth.logout().catch(loading.dismiss);
          },
        },
      ],
    });
    await alert.present();
  }

  private async setupSideMenu() {
    this.appPages = [
      {
        title: 'APP.MENU.HOME',
        url: '/home',
        icon: 'home',
        isShown: true,
      },
      {
        title: 'APP.MENU.QUESTIONNAIRES',
        url: '/questionnaire',
        icon: 'list',
        isShown: true,
      },
      {
        title: 'APP.MENU.STATISTICS',
        url: '/feedback-statistics',
        icon: 'bar-chart',
        isShown: true,
      },
      {
        title: 'APP.MENU.LAB_RESULTS',
        url: '/lab-result',
        icon: 'flask',
        isShown: await this.compliance.userHasCompliances([
          ComplianceType.LABRESULTS,
        ]),
      },
      {
        title: 'APP.MENU.COMPLIANCES',
        url: '/compliance',
        icon: 'newspaper',
        isShown: await this.compliance.isInternalComplianceActive(),
      },
      {
        title: 'APP.MENU.SETTINGS',
        url: '/settings',
        icon: 'settings',
        isShown: true,
      },
      {
        title: 'APP.MENU.CONTACT',
        url: '/contact',
        icon: 'person',
        isShown: true,
      },
    ].filter((page) => page.isShown);
  }

  private styleStatusBar() {
    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setStyle({ style: Style.Light });
    StatusBar.setBackgroundColor({ color: '#599118' }); // --ion-color-tertiary
  }
}
