/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  LOCALE_ID,
  NgModule,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeDe from '@angular/common/locales/de';
import localeEn from '@angular/common/locales/en';
import localeFr from '@angular/common/locales/fr';
import localeEs from '@angular/common/locales/es';
import localeDeExtra from '@angular/common/locales/extra/de';
import localeEnExtra from '@angular/common/locales/extra/en';
import localeFrExtra from '@angular/common/locales/extra/fr';
import localeEsExtra from '@angular/common/locales/extra/es';
import { ReactiveFormsModule } from '@angular/forms';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { IonicModule, IonicRouteStrategy, Platform } from '@ionic/angular';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { MarkdownModule } from 'ngx-markdown';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { LocaleService } from './shared/services/locale/locale.service';
import { contentTypeInterceptor } from './shared/interceptors/content-type-interceptor';
import { unauthorizedInterceptor } from './shared/interceptors/unauthorized-interceptor';
import { httpErrorInterceptor } from './shared/interceptors/http-error-interceptor.service';
import { initializeExistingSession } from './initialize-existing-session';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { AuthService } from './auth/auth.service';
import { NetworkService } from './shared/services/network/network.service';
import { initializeNetwork } from './initialize-network';
import { tokenInterceptor } from './shared/interceptors/token-interceptor';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/');
}

registerLocaleData(localeEn, 'en', localeEnExtra);
registerLocaleData(localeDe, 'de', localeDeExtra);
registerLocaleData(localeFr, 'fr', localeFrExtra);
registerLocaleData(localeEs, 'es', localeEsExtra);

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({ swipeBackEnabled: false }),
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
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy,
    },
    provideAppInitializer(() => {
      const initializerFn = initializeNetwork(inject(NetworkService));
      return initializerFn();
    }),
    provideAppInitializer(() => {
      const initializerFn = initializeExistingSession(
        inject(Platform),
        inject(EndpointService),
        inject(AuthService)
      );
      return initializerFn();
    }),
    {
      provide: LOCALE_ID,
      useFactory: (localeService: LocaleService) => {
        return localeService.currentLocale;
      },
      deps: [LocaleService],
    },
    InAppBrowser,
    provideHttpClient(
      withInterceptors([
        tokenInterceptor,
        contentTypeInterceptor,
        unauthorizedInterceptor,
        httpErrorInterceptor,
      ])
    ),
  ],
})
export class AppModule {}
