/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRunner } from '@pia/lib-service-core';
import { PublicApiServer } from './server';
import { adminAuthClient } from './clients/authServerClient';

adminAuthClient
  .waitForServer()
  .then(() => new ServerRunner(new PublicApiServer()).start())
  .catch(console.error);
