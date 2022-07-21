/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalPersonalDataHandler } from '../../handlers/internal/internalPersonalDataHandler';

const route: ServerRoute = {
  path: '/personal/personalData/proband/{username}',
  method: 'DELETE',
  handler: InternalPersonalDataHandler.deleteOne,
  options: {
    description: 'delete the personal data of the given proband',
    tags: ['api'],
    validate: {
      params: Joi.object({
        username: Joi.string()
          .description('the probands username to delete data for')
          .required(),
      }).unknown(),
    },
    response: {
      schema: false,
    },
  },
};

export default route;
