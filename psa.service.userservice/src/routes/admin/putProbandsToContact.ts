/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { ProbandsToContactHandler } from '../../handlers/probandsToContactHandler';

const route: ServerRoute = {
  path: '/admin/probandstocontact/{id}',
  method: 'PUT',
  handler: ProbandsToContactHandler.updateOne,
  options: {
    description: 'confirms a deletion request',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number().description('the id of the record').required(),
      }).unknown(),
      payload: Joi.object({
        processed: Joi.boolean()
          .optional()
          .description('the proband has been contacted')
          .required()
          .default(false),
      }).unknown(),
    },
  },
};

export default route;
