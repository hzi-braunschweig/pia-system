/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { environmentBase } from './environment.base';
import { Environment } from './interfaces/environment';

export const environment: Environment = {
  ...environmentBase,
  baseUrl: 'https://pia-app',
  authServer: {
    url: `${window.location.protocol}//pia-app/api/v1/auth`,
    realm: 'pia-proband-realm',
    clientId: 'pia-proband-mobile-app-client',
  },
};
