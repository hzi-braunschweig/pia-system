/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { FeedbackStatisticConfigurationHandler } from '../../handlers/feedbackStatisticConfigurationHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/configuration/{configurationId}',
  method: 'GET',
  handler:
    FeedbackStatisticConfigurationHandler.getFeedbackStatisticConfiguration,
  options: {
    description: 'returns feedback statistic configurations',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
        configurationId: Joi.number()
          .description('the id of the configuration')
          .required(),
      }).required(),
    },
  },
};

export default route;
