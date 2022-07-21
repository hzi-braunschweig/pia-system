/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultsHandler } from '../../handlers/laboratoryResultsHandler';

const route: ServerRoute = {
  path: '/admin/probands/{pseudonym}/labResults',
  method: 'POST',
  handler: LaboratoryResultsHandler.createOneResult,
  options: {
    description: 'creates a single laboratory result',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Untersuchungsteam', 'realm:ProbandenManager'],
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the username of the proband')
          .lowercase()
          .required(),
      }).unknown(),
      payload: Joi.object({
        sample_id: Joi.string()
          .uppercase()
          .description('the id of the sample')
          .default('TEST-987654321')
          .required(),
        dummy_sample_id: Joi.string()
          .uppercase()
          .description('the id of the backup sample')
          .default(null)
          .optional()
          .allow('')
          .allow(null),
        new_samples_sent: Joi.boolean()
          .description(
            'true if the sample was sent to the tn, false otherwise, null if handed out directly (UT)'
          )
          .allow(null),
      }),
    },
  },
};

export default route;
