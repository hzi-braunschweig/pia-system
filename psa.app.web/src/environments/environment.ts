/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

// This file will be replaced during build.
// The list of file replacements can be found in `angular.json`.

import { baseEnvironment, Environment } from './environment.base';
/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/plugins/zone-error'; // Included with Angular CLI.

export const environment: Environment = {
  ...baseEnvironment,
  production: false,
  baseUrl: window.location.origin,
  defaultLanguage: 'en-US',
  isSormasEnabled: true,
  isDevelopmentSystem: true,
  authserver: {
    url: `${window.location.protocol}//${window.location.hostname}/api/v1/auth`,
    realm: 'pia-proband-realm',
    clientId: 'pia-proband-web-app-client',
  },
};
