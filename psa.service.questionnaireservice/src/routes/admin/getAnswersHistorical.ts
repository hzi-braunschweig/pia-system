/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { AnswersHandler } from '../../handlers/answersHandler';

const route: ServerRoute = {
  path: '/admin/questionnaireInstances/{id}/answersHistorical',
  method: 'GET',
  handler: AnswersHandler.getHistorical,
  options: {
    description:
      'get the historical answers for the questionnaire instance if the user has access',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Untersuchungsteam',
    },
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
