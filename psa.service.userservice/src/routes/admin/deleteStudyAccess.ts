/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { StudyAccessesHandler } from '../../handlers/studyAccessesHandler';
import Joi from 'joi';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/accesses/{username}',
  method: 'DELETE',
  handler: StudyAccessesHandler.deleteOne,
  options: {
    description:
      'deletes the study access with the specified username if the user has access',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .description('the name of the study')
          .required()
          .default('Teststudie1'),
        username: Joi.string()
          .description('the name of the user')
          .lowercase()
          .required()
          .default('Testproband1'),
      }).unknown(),
    },
  },
};

export default route;
