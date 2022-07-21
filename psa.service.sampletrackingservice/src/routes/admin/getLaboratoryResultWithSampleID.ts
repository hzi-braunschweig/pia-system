/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultsHandler } from '../../handlers/laboratoryResultsHandler';

const route: ServerRoute = {
  path: '/admin/labResults/{sampleId}',
  method: 'GET',
  handler: LaboratoryResultsHandler.getOneResultWitSampleID,
  options: {
    description: 'returns single laboratory result',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:ProbandenManager'],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        sampleId: Joi.string()
          .uppercase()
          .description('the id of the labresult')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
