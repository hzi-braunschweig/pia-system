/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { environment } from '../../environments/environment';

interface LanguageSettings {
  language: string;
  locale: string;
  flagIcons: string[];
}

@Injectable({
  providedIn: 'root',
})
export class LocaleService {
  public readonly supportedLanguages: LanguageSettings[] = [
    {
      language: 'English',
      locale: 'en-US',
      flagIcons: ['gb', 'us'],
    },
    {
      language: 'Deutsch',
      locale: 'de-DE',
      flagIcons: ['de'],
    },
    {
      language: 'Deutsch (Schweiz)',
      locale: 'de-CH',
      flagIcons: ['ch'],
    },
  ];
  private readonly iso639_1FallbackLanguages = {
    en: 'en-US',
    de: 'de-DE',
  };
  private readonly fallbackLanguage: string = 'en-US';

  constructor(private translate: TranslateService) {
    this.fallbackLanguage = this.findBestLocale(environment.defaultLanguage);
    this.translate.addLangs(this.supportedLocales);
    this.translate.setDefaultLang(this.fallbackLanguage);
    let locale = localStorage.getItem('locale');
    if (!locale) {
      locale = this.translate.getBrowserCultureLang();
      if (!this.isLocaleSupported(locale)) {
        const browserLang = this.translate.getBrowserLang();
        locale = this.iso639_1FallbackLanguages[browserLang];
      }
    }
    this.currentLocale = locale;
  }

  private isLocaleSupported(locale: string): boolean {
    if (!locale) {
      return false;
    }
    return this.supportedLocales.some(
      (supportedLocale) =>
        supportedLocale.toLowerCase() === locale.toLowerCase()
    );
  }

  get supportedLocales(): string[] {
    return this.supportedLanguages.map((lang) => lang.locale);
  }

  get currentFlagIcons(): string[] {
    const languageSettings = this.supportedLanguages.find(
      (lang) => lang.locale === this.currentLocale
    );
    return languageSettings.flagIcons;
  }

  get currentLocale(): string {
    return localStorage.getItem('locale');
  }

  set currentLocale(locale) {
    locale = this.findBestLocale(locale);
    localStorage.setItem('locale', locale);
    this.translate.use(locale); // This could take some ms to set the new language
  }

  private findBestLocale(locale: string): string {
    if (!locale) {
      return this.fallbackLanguage;
    }
    if (this.isLocaleSupported(locale)) {
      return this.supportedLocales.find(
        (supportedLocale) =>
          supportedLocale.toLowerCase() === locale.toLowerCase()
      );
    }
    if (this.iso639_1FallbackLanguages[locale.substring(0, 2)]) {
      return this.iso639_1FallbackLanguages[locale.substring(0, 2)];
    }
    return this.fallbackLanguage;
  }
}
