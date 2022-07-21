/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { LocaleService } from './locale.service';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from '../../environments/environment';
import { CurrentUser } from './current-user.service';

describe('LocaleService', () => {
  let currentUserMock: Partial<CurrentUser>;

  function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
    return new TranslateHttpLoader(http);
  }

  beforeEach(() => {
    currentUserMock = {
      locale: 'de-DE',
    };

    TestBed.configureTestingModule({
      imports: [
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: HttpLoaderFactory,
            deps: [HttpClient],
          },
        }),
      ],
      providers: [
        {
          provide: CurrentUser,
          useValue: currentUserMock,
        },
      ],
    });
  });

  it('should be created', () => {
    const newService: LocaleService = TestBed.inject(LocaleService);
    expect(newService).toBeTruthy();
  });

  describe('setting the locale', () => {
    let service: LocaleService;
    beforeEach((done) => {
      environment.defaultLanguage = 'en-US';
      service = TestBed.inject(LocaleService);
      setTimeout(done, 100);
    });

    it('should apply de-DE', () => {
      service.currentLocale = 'de-DE';
      expect(service.currentLocale).toEqual('de-DE');
    });

    it('should apply en-US as default for undefined', () => {
      service.currentLocale = undefined;
      expect(service.currentLocale).toEqual('en-US');
    });

    it('should apply en-US as default for random string', () => {
      service.currentLocale = 'cvrdce';
      expect(service.currentLocale).toEqual('en-US');
    });

    it('should apply en-US as ISO639-1 mapping for en', () => {
      service.currentLocale = 'en';
      expect(service.currentLocale).toEqual('en-US');
    });

    it('should apply de-DE as ISO639-1 mapping for de', () => {
      service.currentLocale = 'de';
      expect(service.currentLocale).toEqual('de-DE');
    });

    it('should apply de-DE for de-de', () => {
      service.currentLocale = 'de-de';
      expect(service.currentLocale).toEqual('de-DE');
    });

    it('should apply de-DE for non existing german accent de-AC by ISO639-1 mapping', () => {
      service.currentLocale = 'de-AC';
      expect(service.currentLocale).toEqual('de-DE');
    });
  });

  describe('respecting user selected locale', () => {
    it('should respect the language introduced by current user', () => {
      currentUserMock.locale = 'de-CH';

      const service = TestBed.inject(LocaleService);

      expect(service.currentLocale).toEqual('de-CH');
    });

    it('should fallback if user selection is undefined', () => {
      currentUserMock.locale = undefined;

      const service = TestBed.inject(LocaleService);

      // this case depends on chrome and its environment
      // we just want to make sure one of the allowed fallback languages
      // is set as current locale
      expect(['en-US', 'de-DE']).toContain(service.currentLocale);
    });

    it('should fallback if user selection is nonsense', () => {
      currentUserMock.locale = 'kiwbv';

      const service = TestBed.inject(LocaleService);

      expect(service.currentLocale).toEqual('en-US');
    });

    it('should fallback if user selection is not an implemented langauge', () => {
      currentUserMock.locale = 'fr-FR';

      const service = TestBed.inject(LocaleService);

      expect(service.currentLocale).toEqual('en-US');
    });
  });
});
