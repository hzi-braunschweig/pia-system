/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { QuestionnairesHandler } from '../../handlers/questionnairesHandler';
import { questionnaireRequestPayload } from '../questionnaireRequestValidators';

const route: ServerRoute = {
  path: '/admin/questionnaires/{id}/{version}',
  method: 'PUT',
  handler: QuestionnairesHandler.update,
  options: {
    description: 'updates the questionnaire with the specified id',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
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
      payload: questionnaireRequestPayload,
      failAction: (_request, _h, err) => err ?? null, // show detailed validation error
    },
  },
};

export default route;
