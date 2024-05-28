/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AuthServerClient } from '@pia-system/lib-auth-server-client';
import { config } from '../config';

export const probandAuthClient = new AuthServerClient(
  config.servers.authserver.probandManagementClient
);
