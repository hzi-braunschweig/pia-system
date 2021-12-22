/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { InternalStudyHandler } from '../../handlers/internal/internalStudyHandler';

const route: ServerRoute = {
  path: '/user/studies/{studyName}',
  method: 'GET',
  handler: InternalStudyHandler.getStudy,
  options: {
    description: 'looks up the primary study of a user',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
          .description('the unique name of the study to query')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
