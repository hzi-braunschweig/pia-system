/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';
import { QuestionnairesHandler } from '../handlers/questionnairesHandler';
import { Questionnaire } from '../models/questionnaire';

const route: ServerRoute = {
  path: '/questionnaire/{study}/questionnaires/{id}/{version}',
  method: 'PATCH',
  handler: QuestionnairesHandler.patch,
  options: {
    description:
      'Deactivate a questionnaire so that users do not get new questionnaire instances',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        study: Joi.string()
          .description('the study of the questionnaire')
          .required(),
        id: Joi.number()
          .integer()
          .description('the id of the questionnaire')
          .required(),
        version: Joi.number()
          .integer()
          .description('the version of the questionnaire')
          .required(),
      }).unknown(false),
      payload: Joi.object<Partial<Questionnaire>>({
        active: Joi.boolean().valid(false).optional(),
      }).unknown(false),
    },
    response: {},
  },
};

export default route;
