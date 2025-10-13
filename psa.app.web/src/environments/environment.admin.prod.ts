/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { baseEnvironment, Environment } from './environment.base';

export const environment: Environment = {
  ...baseEnvironment,
  production: true,
  baseUrl: `${window.location.origin}/admin`,
  defaultLanguage: '${DEFAULT_LANGUAGE}',
  isSormasEnabled:
    // @ts-expect-error This will be replaced by a variable in the CI/CD pipeline
    '${IS_SORMAS_ENABLED}' && '${IS_SORMAS_ENABLED}'.toLowerCase() !== 'false',
  isDevelopmentSystem:
    // @ts-expect-error This will be replaced by a variable in the CI/CD pipeline
    '${IS_DEVELOPMENT_SYSTEM}' &&
    '${IS_DEVELOPMENT_SYSTEM}'.toLowerCase() !== 'false',
  isE2ETestSystem:
    // @ts-expect-error This will be replaced by a variable in the CI/CD pipeline
    '${IS_E2E_TEST_SYSTEM}' && '${IS_E2E_TEST_SYSTEM}'.toLowerCase() === 'true',
  authserver: {
    url: window.location.origin + '/api/v1/auth',
    realm: 'pia-admin-realm',
    clientId: 'pia-admin-web-app-client',
  },
};
