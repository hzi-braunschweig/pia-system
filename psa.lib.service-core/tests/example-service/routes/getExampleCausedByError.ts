/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { ErrorWithCausedBy } from '../../../src';

class ExampleCausedBy extends ErrorWithCausedBy {}

const route: ServerRoute = {
  path: '/example/causedByError',
  method: 'GET',
  handler: () => {
    throw new ExampleCausedBy('An error', new Error('Another error'));
  },
};

export default route;
