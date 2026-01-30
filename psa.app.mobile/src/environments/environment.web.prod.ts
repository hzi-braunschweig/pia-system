/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { environment as environmentBase } from './environment.web';
import { Environment } from './interfaces/environment';

export const environment: Environment = {
  ...environmentBase,
  production: true,
  baseUrl: window.location.origin,
  authServer: {
    ...environmentBase.authServer,
    url: window.location.origin + '/api/v1/auth',
  },
  locale: '${DEFAULT_LANGUAGE}',
};
