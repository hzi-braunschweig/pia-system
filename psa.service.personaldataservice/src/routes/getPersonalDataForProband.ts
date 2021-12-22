/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PersonalDataHandler } from '../handlers/personalDataHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/personal/personalData/proband/{pseudonym}',
  method: 'GET',
  handler: PersonalDataHandler.getOne,
  options: {
    description: 'get the personal data for the given proband',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the probands pseudonym to get data for')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
