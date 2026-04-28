/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ApplicationConfig,
  provideAppInitializer,
  inject,
  LOCALE_ID,
  importProvidersFrom,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  Platform,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import {
  provideHttpClient,
  withInterceptors,
  HttpClient,
} from '@angular/common/http';

import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { MarkdownModule } from 'ngx-markdown';
import { ReactiveFormsModule } from '@angular/forms';

import { initializeNetwork } from './initialize-network';
import { initializeExistingSession } from './initialize-existing-session';
import { NetworkService } from './shared/services/network/network.service';
import { EndpointService } from './shared/services/endpoint/endpoint.service';
import { AuthService } from './auth/auth.service';
import { KeycloakEventHandlingService } from './auth/keycloak-event-handling.service';
import { LocaleService } from './shared/services/locale/locale.service';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';

import { tokenInterceptor } from './shared/interceptors/token-interceptor';
import { contentTypeInterceptor } from './shared/interceptors/content-type-interceptor';
import { unauthorizedInterceptor } from './shared/interceptors/unauthorized-interceptor';
import { httpErrorInterceptor } from './shared/interceptors/http-error-interceptor.service';
import { routes } from './app.routes';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/');
}

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      BrowserModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
      }),
      MarkdownModule.forRoot(),
      ReactiveFormsModule
    ),
    provideRouter(routes, withPreloading(PreloadAllModules)),
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
    provideAppInitializer(() => {
      return inject(LocaleService).init();
    }),
    provideAppInitializer(() => {
      // Initialize KeycloakEventHandlingService to ensure its constructor runs
      inject(KeycloakEventHandlingService);
      return Promise.resolve();
    }),
    {
      provide: LOCALE_ID,
      useFactory: (localeService: LocaleService) => localeService.currentLocale,
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
    provideIonicAngular({ swipeBackEnabled: false }),
  ],
};
