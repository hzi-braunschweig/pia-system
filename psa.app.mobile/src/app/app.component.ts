import { Component, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { AppVersion } from '@ionic-native/app-version/ngx';
import { TranslateService } from '@ngx-translate/core';

import { AuthService } from './auth/auth.service';
import { AuthClientService } from './auth/auth-client.service';
import { ComplianceType } from './compliance/compliance.model';
import { ComplianceService } from './compliance/compliance-service/compliance.service';
import { NotificationService } from './shared/services/notification/notification.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { BadgeService } from './shared/services/badge/badge.service';

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
    private translate: TranslateService,
    private authClient: AuthClientService,
    private auth: AuthService,
    private compliance: ComplianceService,
    private notification: NotificationService,
    private endpoint: EndpointService,
    private badgeService: BadgeService,
    private router: Router
  ) {
    this.onAppStart();
    this.auth.loggedIn.subscribe(() => this.onLogin());
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
  private onLogin() {
    this.setupSideMenu();
    this.notification.initPushNotifications(
      this.auth.getCurrentUser().username
    );
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

    this.statusBar.styleDefault();
    this.splashScreen.hide();

    this.piaVersion = await this.appVersion.getVersionNumber();
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
          handler: () => this.logout(),
        },
      ],
    });
    alert.present();
  }

  private logout() {
    try {
      this.authClient.logout(this.auth.getCurrentUser().username);
    } catch (error) {
      console.error('Logout / Deactivation of notifications failed.', error);
    }

    this.auth.resetCurrentUser();
    this.router.navigate(['auth', 'login']);
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
}