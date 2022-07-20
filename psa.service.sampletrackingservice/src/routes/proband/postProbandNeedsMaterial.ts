/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { MaterialHandler } from '../../handlers/materialHandler';

const route: ServerRoute = {
  path: '/probands/{pseudonym}/needsMaterial',
  method: 'POST',
  handler: MaterialHandler.requestNewMaterial,
  options: {
    description: 'Creates request for material',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the id of the proband who needs new material')
          .lowercase()
          .required(),
      }).unknown(),
    },
  },
};

export default route;
