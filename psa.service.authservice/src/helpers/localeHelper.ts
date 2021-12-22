/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const supportedLocales = [
  'de-DE',
  'de-CH',
  'en-US',
  'fr-CH',
  'fr-FR',
  'it-CH',
  'it-IT',
];

export function isLocaleSupported(locale: string): boolean {
  return supportedLocales.includes(locale);
}

export const fallbackLocale = 'en-US';
