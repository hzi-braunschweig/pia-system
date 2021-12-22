/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import pendingDeletionsHandler from '../handlers/pendingDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/studies/{studyName}/pendingdeletions',
  method: 'GET',
  handler: pendingDeletionsHandler.getAllOfStudy,
  options: {
    description: 'get all the pending deletions in a study',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).unknown(false),
      query: Joi.object({
        type: Joi.string()
          .valid('proband', 'sample', 'study') // not yet supported: 'sample', 'study'
          .required()
          .description('the type of the pending deletion'),
      }),
    },
  },
};

export default route;
