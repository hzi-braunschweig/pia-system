/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QuestionnaireInstancesHandler } from '../../handlers/questionnaireInstancesHandler';

const validStatusForUser = [
  'active',
  'in_progress',
  'released_once',
  'released_twice',
];

const route: ServerRoute = {
  path: '/questionnaireInstances',
  method: 'GET',
  handler: QuestionnaireInstancesHandler.getAll,
  options: {
    description: 'get all questionnaire instances the user has access to',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
    validate: {
      query: Joi.object({
        status: Joi.array()
          .items(Joi.string().valid(...validStatusForUser))
          .default(validStatusForUser)
          .unique()
          .single(),
      }),
    },
  },
};

export default route;
