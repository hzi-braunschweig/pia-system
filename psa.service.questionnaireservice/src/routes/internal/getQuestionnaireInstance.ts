/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { InternalQuestionnaireInstancesHandler } from '../../handlers/internal/internalQuestionnaireInstancesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/questionnaire/questionnaireInstances/{id}',
  method: 'GET',
  handler: InternalQuestionnaireInstancesHandler.getOne,
  options: {
    description: 'get the questionnaire instance with the specified id',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire instance')
          .required(),
      }).unknown(),
      query: Joi.object({
        filterQuestionnaireByConditions: Joi.bool()
          .optional()
          .description(
            'filters all questions and answer options of the questionnaire, ' +
              'that are not required for this questionnaire instance, ' +
              'because the conditions are not fulfilled'
          ),
      }),
    },
  },
};
export default route;
