/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Server } from './server';
import { ServerRunner } from '@pia/lib-service-core';
import { connectDatabase } from './db';
import { adminAuthClient, probandAuthClient } from './clients/authServerClient';

connectDatabase()
  .then(async () => {
    await probandAuthClient.waitForServer();
    await adminAuthClient.waitForServer();
  })
  .then(() => new ServerRunner(Server).start())
  .catch(console.error);
