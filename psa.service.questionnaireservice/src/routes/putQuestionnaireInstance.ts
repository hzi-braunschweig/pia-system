/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QuestionnaireInstancesHandler } from '../handlers/questionnaireInstancesHandler';

const MAX_PROGRESS = 100;

const route: ServerRoute = {
  path: '/questionnaire/questionnaireInstances/{id}',
  method: 'PUT',
  handler: QuestionnaireInstancesHandler.update,
  options: {
    description:
      'updates the questionnaire instance with the specified id to released',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
      }).unknown(),
      payload: Joi.object({
        status: Joi.string()
          .optional()
          .default(null)
          .valid(
            'inactive',
            'active',
            'in_progress',
            'released_once',
            'released_twice',
            'released',
            null
          ),
        progress: Joi.number()
          .required()
          .default(0)
          .min(0)
          .max(MAX_PROGRESS)
          .description('progress expressed as a percentage'),
        release_version: Joi.number()
          .optional()
          .default(0)
          .description('number of releasing times'),
      }).unknown(),
    },
  },
};

export default route;
