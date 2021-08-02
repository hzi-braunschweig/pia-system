/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const environment = {
  production: true,
  defaultLanguage: '${DEFAULT_LANGUAGE}',
  matomoUrl: '${MATOMO_URL}',
  isSormasEnabled:
    '${IS_SORMAS_ENABLED}' && '${IS_SORMAS_ENABLED}'.toLowerCase() !== 'false',
  isDevelopmentSystem:
    '${IS_DEVELOPMENT_SYSTEM}' &&
    '${IS_DEVELOPMENT_SYSTEM}'.toLowerCase() !== 'false',
};
