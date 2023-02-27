/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import localeDeExtra from '@angular/common/locales/extra/de';
import localeEnExtra from '@angular/common/locales/extra/en';
import { ReactiveFormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
} from '@angular/common/http';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { SplashScreen } from '@awesome-cordova-plugins/splash-screen/ngx';
import { StatusBar } from '@awesome-cordova-plugins/status-bar/ngx';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppVersion } from '@awesome-cordova-plugins/app-version/ngx';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
import { File } from '@awesome-cordova-plugins/file/ngx';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import { BarcodeScanner } from '@awesome-cordova-plugins/barcode-scanner/ngx';
import { Camera } from '@awesome-cordova-plugins/camera/ngx';
import { Chooser } from '@awesome-cordova-plugins/chooser/ngx';
import { MarkdownModule } from 'ngx-markdown';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';
import { Network } from '@awesome-cordova-plugins/network/ngx';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LocaleService } from './shared/services/locale/locale.service';
import { ContentTypeInterceptor } from './shared/interceptors/content-type-interceptor';
import { UnauthorizedInterceptor } from './shared/interceptors/unauthorized-interceptor';
import { HttpErrorInterceptor } from './shared/interceptors/http-error-interceptor.service';
import { KeycloakAngularModule } from 'keycloak-angular';
import { initializeExistingSession } from './initialize-existing-session';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { AuthService } from './auth/auth.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/');
}

registerLocaleData(localeEn, 'en', localeEnExtra);
registerLocaleData(localeDe, 'de', localeDeExtra);

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    IonicModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
    MarkdownModule.forRoot(),
    AppRoutingModule,
    ReactiveFormsModule,
    KeycloakAngularModule,
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeExistingSession,
      deps: [Platform, EndpointService, AuthService],
      multi: true,
    },
    {
      provide: LOCALE_ID,
      useFactory: (localeService: LocaleService) => {
        return localeService.currentLocale;
      },
      deps: [LocaleService],
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ContentTypeInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpErrorInterceptor,
      multi: true,
    },
    StatusBar,
    SplashScreen,
    AppVersion,
    FileOpener,
    File,
    Keyboard,
    BarcodeScanner,
    Camera,
    Chooser,
    FirebaseX,
    Network,
    InAppBrowser,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
