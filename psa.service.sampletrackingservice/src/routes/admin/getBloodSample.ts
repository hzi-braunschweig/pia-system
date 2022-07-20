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
  method: 'GET',
  handler: BloodSamplesHandler.getOneSample,
  options: {
    description: 'returns single blood sample',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:Forscher',
        'realm:Untersuchungsteam',
        'realm:ProbandenManager',
      ],
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
    },
  },
};

export default route;
