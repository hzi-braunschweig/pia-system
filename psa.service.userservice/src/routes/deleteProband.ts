/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { ProbandsHandler } from '../handlers/probandsHandler';

const route: ServerRoute = {
  path: '/user/probands/{pseudonym}/account',
  method: 'DELETE',
  handler: ProbandsHandler.deleteAccount,
  options: {
    description: 'deletes a proband`s account and selected data',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        pseudonym: Joi.string()
          .description('the pseudonym of the proband to delete')
          .required(),
      }).unknown(),
      query: Joi.object({
        deletionType: Joi.string()
          .description(
            'whether all connected data should be deleted (full) or only contact and account data (contact)'
          )
          .allow('full', 'contact')
          .default('full'),
      }).unknown(),
    },
  },
};

export default route;
