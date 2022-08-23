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
  method: 'GET',
  handler: BloodSamplesHandler.getAllSamples,
  options: {
    description: 'returns blood sample list for proband',
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
      }).unknown(),
    },
  },
};

export default route;
