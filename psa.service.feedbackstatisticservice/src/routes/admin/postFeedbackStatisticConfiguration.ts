/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { FeedbackStatisticConfigurationHandler } from '../../handlers/feedbackStatisticConfigurationHandler';
import { feedbackStatisticConfigurationPayloadValidator } from '../feedbackStatisticConfigurationPayloadValidator';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}/configuration',
  method: 'POST',
  handler:
    FeedbackStatisticConfigurationHandler.postFeedbackStatisticConfiguration,
  options: {
    description: 'add feedback statistic configurations',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:Forscher',
    },
    app: { assertStudyAccess: true },
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).required(),
      payload: feedbackStatisticConfigurationPayloadValidator,
    },
  },
};

export default route;
