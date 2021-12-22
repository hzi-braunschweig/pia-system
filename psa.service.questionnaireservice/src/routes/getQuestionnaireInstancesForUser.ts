/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';

import { QuestionnaireInstancesHandler } from '../handlers/questionnaireInstancesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/questionnaire/user/{user_id}/questionnaireInstances',
  method: 'GET',
  handler: QuestionnaireInstancesHandler.getAllForUser,
  options: {
    description: 'get the questionnaire instances for given user',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        user_id: Joi.string()
          .description(
            'the user name of the user to get questionnaire instances for'
          )
          .required(),
      }).unknown(),
    },
  },
};

export default route;
