/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { SpecificError } from '../../../src';
import { StatusCodes } from 'http-status-codes';

class ExampleSpecific extends SpecificError {
  public readonly statusCode = StatusCodes.CONFLICT;
  public readonly errorCode = 'EXAMPLE_ERROR';
}

const route: ServerRoute = {
  path: '/example/specificError',
  method: 'GET',
  handler: () => {
    throw new ExampleSpecific('An error', 'the reason');
  },
};

export default route;
