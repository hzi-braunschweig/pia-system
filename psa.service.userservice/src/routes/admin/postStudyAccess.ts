/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { StudyAccessesHandler } from '../../handlers/studyAccessesHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/accesses',
  method: 'POST',
  handler: StudyAccessesHandler.createOne,
  options: {
    description: 'creates the study access if the user has access',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
      }).unknown(),
      payload: Joi.object({
        username: Joi.string()
          .description('the name of the user')
          .lowercase()
          .required()
          .default('Testproband1'),
        accessLevel: Joi.string()
          .description('the access level of that user to that study')
          .required()
          .valid('read', 'write', 'admin')
          .default('read'),
      }).unknown(),
    },
  },
};

export default route;
