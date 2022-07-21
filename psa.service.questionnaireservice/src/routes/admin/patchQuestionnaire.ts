/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QuestionnairesHandler } from '../../handlers/questionnairesHandler';
import { QuestionnaireDto } from '../../models/questionnaire';

const route: ServerRoute = {
  path: '/admin/{studyName}/questionnaires/{id}/{version}',
  method: 'PATCH',
  handler: QuestionnairesHandler.patch,
  options: {
    description:
      'Deactivate a questionnaire so that users do not get new questionnaire instances',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string()
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
      payload: Joi.object<Partial<QuestionnaireDto>>({
        active: Joi.boolean().valid(false).optional(),
      }).unknown(false),
    },
    response: {},
  },
};

export default route;
