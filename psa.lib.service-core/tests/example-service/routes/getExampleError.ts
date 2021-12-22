/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/example/error',
  method: 'GET',
  handler: () => {
    throw new Error('An unhandled error');
  },
};

export default route;
