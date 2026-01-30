/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AlertController,
  LoadingController,
  Platform,
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonListHeader,
  IonNote,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonFooter,
  IonRouterOutlet,
} from '@ionic/angular/standalone';
import { App } from '@capacitor/app';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

import { AuthService } from './auth/auth.service';
import { register } from 'swiper/element/bundle';
import { SplashScreen } from '@capacitor/splash-screen';
import { addIcons } from 'ionicons';
import {
  barChartSharp,
  flaskSharp,
  homeSharp,
  listSharp,
  logOutOutline,
  newspaperSharp,
  personSharp,
  settingsSharp,
} from 'ionicons/icons';
import { SideMenuService } from './shared/services/side-menu/side-menu.service';

register();

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonListHeader,
    IonNote,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonFooter,
    IonRouterOutlet,
  ],
})
export class AppComponent {
  public piaVersion: string;

  constructor(
    public sideMenu: SideMenuService,
    private platform: Platform,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private translate: TranslateService,
    private auth: AuthService
  ) {
    this.platform.ready().then(() => this.onPlatformReady());
    addIcons({
      logOutOutline,
      homeSharp,
      listSharp,
      barChartSharp,
      settingsSharp,
      personSharp,
      flaskSharp,
      newspaperSharp,
    });
  }

  public async logout() {
    await this.presentConfirmLogout();
  }

  /**
   * Executed as soon as capacitor is ready and plugins may be used
   */
  private async onPlatformReady() {
    if (this.platform.is('hybrid')) {
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
          id: 'confirmButton',
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
}
