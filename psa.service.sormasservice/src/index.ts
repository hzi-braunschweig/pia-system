/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Server } from './server';
import { ServerRunner } from '@pia/lib-service-core';
import { migrateToNewSormasIntegration } from './migrateToNewSormasIntegration';

migrateToNewSormasIntegration()
  .then(() => new ServerRunner(Server).start())
  .catch(console.error);
