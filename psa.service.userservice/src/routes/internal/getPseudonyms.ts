/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalUsersHandler } from '../../handlers/internal/internalUsersHandler';
import { ProbandStatus } from '../../models/probandStatus';

const route: ServerRoute = {
  path: '/user/pseudonyms',
  method: 'GET',
  handler: InternalUsersHandler.getPseudonyms,
  options: {
    description: 'looks up pseudonyms based on filters',
    tags: ['api'],
    validate: {
      query: Joi.object({
        study: Joi.string().description('the name of the study to query'),
        status: Joi.array()
          .single()
          .items(
            Joi.string().allow(
              ProbandStatus.ACTIVE,
              ProbandStatus.DEACTIVATED,
              ProbandStatus.DELETED
            )
          )
          .optional()
          .description('the status of the probands that should be fetched'),
        complianceContact: Joi.boolean().optional(),
      }),
    },
  },
};

export default route;
