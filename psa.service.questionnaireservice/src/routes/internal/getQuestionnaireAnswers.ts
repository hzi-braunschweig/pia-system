/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { InternalQuestionnaireHandler } from '../../handlers/internal/internalQuestionnaireHandler';

const route: ServerRoute = {
  path: '/questionnaire/{id}/answers',
  method: 'GET',
  handler: InternalQuestionnaireHandler.getAnswers,
  options: {
    description: 'get the questionnaire with the specified id',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
      }).unknown(),
      query: Joi.object({
        status: Joi.array()
          .description(
            'the statuses of the questionnaire instance to filter by'
          )
          .items(
            Joi.string().allow(
              'in_progress',
              'released',
              'released_once',
              'released_twice'
            )
          )
          .unique()
          .single(true)
          .optional(),
        minDateOfIssue: Joi.date()
          .iso()
          .description('the minimum date of issue to filter by')
          .optional(),
        maxDateOfIssue: Joi.date()
          .iso()
          .description('the maximum date of issue to filter by')
          .optional(),
        answerOptionIds: Joi.array()
          .description('the answer option ids to filter by')
          .items(Joi.number().integer())
          .single()
          .optional(),
        answerOptionVariableNames: Joi.array()
          .description(
            'the answer option variable names to additionally filter by'
          )
          .items(Joi.string())
          .single()
          .optional(),
      }),
    },
  },
};
export default route;
