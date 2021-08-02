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

exports.isLocaleSupported = function (locale) {
  return supportedLocales.includes(locale);
};

exports.fallbackLocale = 'en-US';
