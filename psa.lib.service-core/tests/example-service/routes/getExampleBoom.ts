/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Boom from '@hapi/boom';

const route: ServerRoute = {
  path: '/example/boom',
  method: 'GET',
  handler: () => {
    throw Boom.preconditionRequired('Something was not as expected');
  },
};

export default route;
