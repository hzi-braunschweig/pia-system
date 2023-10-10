/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { LaboratoryResultTemplateHandler } from '../../handlers/laboratoryResultTemplateHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/labResultTemplate',
  method: 'GET',
  handler: LaboratoryResultTemplateHandler.getTemplate,
  options: {
    description: 'returns the laboratory result template for the study',
    auth: {
      strategy: 'jwt-admin',
      scope: ['realm:Forscher'],
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).required(),
    },
  },
};

export default route;
