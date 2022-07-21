/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';

const route: ServerRoute = {
  path: '/admin/pendingdeletions/study/{studyName}',
  method: 'GET',
  handler: PendingDeletionsHandler.getOneForStudy,
  options: {
    description: 'get a pending deletion for a study',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .description('the study id of the pending deletion to get')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
