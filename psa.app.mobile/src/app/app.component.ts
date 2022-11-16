/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewEncapsulation } from '@angular/core';
import { AlertController, LoadingController, Platform } from '@ionic/angular';
import { SplashScreen } from '@awesome-cordova-plugins/splash-screen/ngx';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from './auth/auth.service';
import { ComplianceType } from './compliance/compliance.model';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { BadgeService } from './shared/services/badge/badge.service';
import { User } from './auth/auth.model';

interface AppPage {
  title: string;
  url: string;
  icon: string;
  isShown: boolean;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class AppComponent {
  public appPages: AppPage[] = [];

  public piaVersion: string;

  constructor(
    private appVersion: AppVersion,
    private platform: Platform,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private auth: AuthService,
    private compliance: ComplianceService,
    private notification: NotificationService,
    private endpoint: EndpointService,
    private badgeService: BadgeService
  ) {
    this.onAppStart();
    this.auth.currentUser$.subscribe((user) => {
      if (user) {
        this.onLogin(user);
      }
    });
    this.compliance.complianceDataChangesObservable.subscribe(() =>
      this.onComplianceChanges()
    );
    this.platform.ready().then(() => this.onPlatformReady());
  }

  onLogout() {
    this.presentConfirmLogout();
    this.badgeService.clear();
  }

  /**
   * Executed once at app start
   */
  private onAppStart() {
    if (!this.endpoint.isCustomEndpoint() && this.auth.isAuthenticated()) {
      this.endpoint.setEndpointForUser(this.auth.getCurrentUser().username);
    }
    if (this.auth.isAuthenticated()) {
      this.setupSideMenu();
    }
  }

  /**
   * Executed on every user login for initializations
   */
  private onLogin(user: User) {
    this.setupSideMenu();
    this.notification.initPushNotifications(user.username);
  }

  /**
   * Executed as soon as user saves compliance data
   */
  private onComplianceChanges() {
    this.setupSideMenu();
  }

  /**
   * Executed as soon as the cordova platform is ready and plugins may be used
   */
  private async onPlatformReady() {
    if (this.auth.isAuthenticated()) {
      this.notification.initPushNotifications(
        this.auth.getCurrentUser().username
      );
    }

    if (this.platform.is('cordova')) {
      this.styleStatusBar();
      this.splashScreen.hide();
      this.piaVersion = await this.appVersion.getVersionNumber();
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
    this.statusBar.overlaysWebView(false);
    this.statusBar.styleLightContent();
    this.statusBar.backgroundColorByHexString('599118'); // --ion-color-tertiary
  }
}
