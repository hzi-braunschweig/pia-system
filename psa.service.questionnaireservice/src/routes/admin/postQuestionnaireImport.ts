/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import { QuestionnairesHandler } from '../../handlers/questionnairesHandler';
import {
  validatorQuestionnaireImportRequestParams,
  validatorQuestionnaireImportRequestPayload,
  validatorQuestionnaireImportResponseBody,
} from '../../models/routes/questionnaireImport';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/questionnaires-import',
  method: 'POST',
  handler: QuestionnairesHandler.import,
  options: {
    description: 'import new questionnaires',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    tags: ['api'],
    validate: {
      params: validatorQuestionnaireImportRequestParams,
      payload: validatorQuestionnaireImportRequestPayload,
      failAction: (_request, _h, err) => err ?? null, // show detailed validation error
    },
    response: {
      schema: validatorQuestionnaireImportResponseBody,
    },
  },
};

export default route;
