/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { QuestionnairesHandler } from '../../handlers/questionnairesHandler';
import { questionnaireRequestPayload } from '../questionnaireRequestValidators';

const route: ServerRoute = {
  path: '/admin/questionnaires',
  method: 'POST',
  handler: QuestionnairesHandler.create,
  options: {
    description: 'create a new questionnaire',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      payload: questionnaireRequestPayload,
      failAction: (_request, _h, err) => err ?? null, // show detailed validation error
    },
  },
};

export default route;
