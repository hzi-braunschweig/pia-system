/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Environment } from './interfaces/environment';

export const environmentBase: Environment = {
  locale: 'en-US',
  baseUrl: window.location.origin,
  androidAppId: 'de.pia.app',
  iOSAppId: 'id1510929221',
  authServer: {
    realm: 'pia-proband-realm',
    clientId: 'pia-proband-mobile-app-client',
  },
};
