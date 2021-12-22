/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { I18n, ConfigurationOptions } from 'i18n';
import { PluginBase, PluginNameVersion, Request, Server } from '@hapi/hapi';
import { MarkRequired } from 'ts-essentials';
import Accept from '@hapi/accept';

declare module '@hapi/hapi' {
  export interface PluginsStates {
    i18n: I18n;
  }
}

export type HapiI18nPluginOptions = ConfigurationOptions;
type ValidatedHapiI18nPluginOptions = MarkRequired<
  HapiI18nPluginOptions,
  'locales' | 'defaultLocale'
>;

/**
 * Plugin that registers i18n to the request and parses the locale from the jwt-Token
 */
export class HapiI18nPlugin
  implements PluginBase<HapiI18nPluginOptions>, PluginNameVersion
{
  public readonly name = 'i18n';

  private readonly FIRST_LOCALE_CHARACTERS = 2;
  private readonly iso639_1FallbackVariants = new Map<string, string>([
    ['en', 'en-US'],
    ['de', 'de-DE'],
  ]);
  private supportedLocales: string[] = [];

  public register(
    server: Server,
    options: HapiI18nPluginOptions = {}
  ): void | Promise<void> {
    if (!options.locales?.length) {
      throw Error('No locales defined!');
    }
    const pluginOptions: ValidatedHapiI18nPluginOptions = {
      updateFiles: false,
      ...options,
      defaultLocale: options.defaultLocale ?? options.locales[0]!,
      locales: options.locales,
    };
    this.supportedLocales = pluginOptions.locales;

    server.ext('onPreHandler', (request, h) => {
      const i18n = new I18n();
      i18n.configure(pluginOptions);
      const locale =
        this.determineBestLocaleFromRequest(request) ??
        pluginOptions.defaultLocale;
      i18n.setLocale(locale);
      request.plugins.i18n = i18n;
      return h.continue;
    });
  }

  private getSupportedLocale(locale: string | undefined): string | undefined {
    if (!locale) {
      return undefined;
    }
    return this.supportedLocales.find(
      (supportedLocale) =>
        supportedLocale.toLowerCase() === locale.toLowerCase()
    );
  }

  private determineBestLocaleFromRequest(request: Request): string | undefined {
    // Try to determine from token
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const tokenLocale = request.auth?.credentials?.['locale'] as
      | string
      | undefined;
    let bestMatch = this.getSupportedLocale(tokenLocale);
    if (bestMatch) return bestMatch;

    // Try to determine from Accept-Language
    const acceptLocales = Accept.languages(request.headers['accept-language']);
    for (const acceptLocale of acceptLocales) {
      // If supported, with variant (dialect)
      bestMatch = this.getSupportedLocale(acceptLocale);
      if (bestMatch) return bestMatch;

      // If not, use fallback-variant
      const fallbackVariant = this.iso639_1FallbackVariants.get(
        acceptLocale.substring(0, this.FIRST_LOCALE_CHARACTERS)
      );
      bestMatch = this.getSupportedLocale(fallbackVariant);
      if (bestMatch) return bestMatch;
    }
    return undefined;
  }
}

export const plugin = new HapiI18nPlugin();
