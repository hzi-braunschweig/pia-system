/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { InternalQuestionnaireInstancesHandler } from '../../handlers/internal/internalQuestionnaireInstancesHandler';

const route: ServerRoute = {
  path: '/questionnaire/user/{pseudonym}/questionnaireInstances',
  method: 'GET',
  handler: InternalQuestionnaireInstancesHandler.getAllForProband,
  options: {
    description: 'get the questionnaire instances for given user',
    tags: ['api'],
    validate: {
      query: Joi.object({
        loadQuestionnaire: Joi.boolean()
          .description(
            'whether to load the questionnaire belonging to the instance or not'
          )
          .default(false),
        status: Joi.array()
          .items(
            Joi.string().allow(
              'inactive',
              'active',
              'in_progress',
              'released',
              'released_once',
              'released_twice',
              'expired',
              'deleted'
            )
          )
          .unique()
          .single(true)
          .default([
            'active',
            'in_progress',
            'released',
            'released_once',
            'released_twice',
          ])
          .description('filter the questionnaire instances by these status'),
      }),
      params: Joi.object({
        pseudonym: Joi.string()
          .description(
            'the pseudonym of the proband to get questionnaire instances for'
          )
          .required(),
      }).unknown(),
    },
  },
};
export default route;
