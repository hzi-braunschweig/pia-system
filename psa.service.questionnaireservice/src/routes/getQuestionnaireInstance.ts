/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QuestionnaireInstancesHandler } from '../handlers/questionnaireInstancesHandler';

const route: ServerRoute = {
  path: '/questionnaire/questionnaireInstances/{id}',
  method: 'GET',
  handler: QuestionnaireInstancesHandler.getOne,
  options: {
    description:
      'get the questionnaire instance with the specified id if the user has access',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire instance')
          .required(),
      }).unknown(),
    },
  },
};

export default route;
