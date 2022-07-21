/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { CompliancePlaceholderHandler } from '../../handlers/compliancePlaceholderHandler';

const route: ServerRoute = {
  path: '/admin/{studyName}/questionnaire-placeholder',
  method: 'GET',
  handler: CompliancePlaceholderHandler.getComplianceQuestionnairePlaceholders,
  options: {
    description: 'fetches compliance placeholders for questionnaire',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).unknown(),
    },
  },
};

export default route;
