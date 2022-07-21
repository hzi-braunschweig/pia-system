/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { BloodSamplesHandler } from '../../handlers/bloodSamplesHandler';

const route: ServerRoute = {
  path: '/admin/probands/{pseudonym}/bloodSamples/{sampleId}',
  method: 'PUT',
  handler: BloodSamplesHandler.updateOneSample,
  options: {
    description: 'updates a single blood sample',
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
        sampleId: Joi.string()
          .description('the id of the blood sample')
          .required(),
      }).unknown(),
      payload: Joi.object({
        remark: Joi.string()
          .allow('')
          .description('a free remark text the PM can save')
          .optional(),
        blood_sample_carried_out: Joi.boolean()
          .allow(null)
          .description('status of the blood sample')
          .optional(),
      }),
    },
  },
};

export default route;
