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
  path: '/admin/studies/{studyName}/configuration/{configurationId}',
  method: 'PUT',
  handler:
    FeedbackStatisticConfigurationHandler.putFeedbackStatisticConfiguration,
  options: {
    description: 'update feedback statistic configurations',
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
      payload: feedbackStatisticConfigurationPayloadValidator.append({
        id: Joi.number()
          .optional()
          .description(
            'the id of the configuration will be overwritten by the id in the url'
          ),
      }),
    },
  },
};

export default route;
