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
  method: 'GET',
  handler: StudyAccessesHandler.getAll,
  options: {
    description: 'gets all study accesses of given study',
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
      }).unknown(),
    },
  },
};

export default route;
