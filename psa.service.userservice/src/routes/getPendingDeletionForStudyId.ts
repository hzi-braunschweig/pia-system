/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import pendingDeletionsHandler from '../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/user/pendingdeletions/study/{study_id}',
  method: 'GET',
  handler: pendingDeletionsHandler.getOneForStudyId,
  options: {
    description: 'get a pending deletion for a study',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study_id: Joi.string()
          .description('the study id of the pending deletion to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
