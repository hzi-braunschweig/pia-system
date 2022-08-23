/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultsHandler } from '../../handlers/laboratoryResultsHandler';
import { putLaboratoryResultRequestValidator } from '../laboratoryResultValidators';

const route: ServerRoute = {
  path: '/probands/{pseudonym}/labResults/{resultId}',
  method: 'PUT',
  handler: LaboratoryResultsHandler.updateOneResult,
  options: {
    description: 'updates a single laboratory result',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: putLaboratoryResultRequestValidator,
  },
};

export default route;
