/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { BloodSamplesHandler } from '../../handlers/bloodSamplesHandler';

const route: ServerRoute = {
  path: '/admin/probands/{pseudonym}/bloodSamples',
  method: 'POST',
  handler: BloodSamplesHandler.createOneSample,
  options: {
    description: 'creates a single blood sample',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Untersuchungsteam'],
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
          .description('the id of the blood sample')
          .default('Test-987654321')
          .required(),
        blood_sample_carried_out: Joi.string()
          .description('the status of the blood sample')
          .optional(),
      }),
    },
  },
};

export default route;
