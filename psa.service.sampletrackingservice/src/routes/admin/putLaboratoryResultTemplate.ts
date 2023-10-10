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
  method: 'PUT',
  handler: LaboratoryResultTemplateHandler.updateTemplate,
  options: {
    description: 'updates the laboratory result template for the study',
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

      payload: Joi.object({
        markdownText: Joi.string()
          .required()
          .description('the markdown text for the template'),
      }),
    },
  },
};

export default route;
