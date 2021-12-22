/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { InternalQuestionnaireInstancesHandler } from '../../handlers/internal/internalQuestionnaireInstancesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/questionnaire/questionnaireInstances/{id}/answers',
  method: 'GET',
  handler:
    InternalQuestionnaireInstancesHandler.getQuestionnaireInstanceAnswers,
  options: {
    description:
      'get the answers for a questionnaire instance with the specified id',
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
