/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { InternalQuestionnaireHandler } from '../../handlers/internal/internalQuestionnaireHandler';

const route: ServerRoute = {
  path: '/questionnaire/{id}/{version}',
  method: 'GET',
  handler: InternalQuestionnaireHandler.getOne,
  options: {
    description: 'get the questionnaire with the specified id',
    tags: ['api'],
    validate: {
      params: Joi.object({
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
        version: Joi.number()
          .integer()
          .description('the version of the questionnaire')
          .required(),
      }).unknown(),
    },
  },
};
export default route;
