/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRunner } from '@pia/lib-service-core';
import { AuthEventProxyServer } from './server';

try {
  new ServerRunner(new AuthEventProxyServer()).start();
} catch (e) {
  console.error('Could not start service: ', e);
}
