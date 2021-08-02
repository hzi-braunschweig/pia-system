/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { QuestionnairesHandler } from '../handlers/questionnairesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/questionnaire/questionnaires/{id}/{version}',
  method: 'DELETE',
  handler: QuestionnairesHandler.deleteOne,
  options: {
    description: 'delete the questionnaire with the specified id',
    auth: 'jwt',
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
