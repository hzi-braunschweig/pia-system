/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { FeedbackStatisticHandler } from '../../handlers/feedbackStatisticHandler';

const route: ServerRoute = {
  path: '/admin/studies/{studyName}',
  method: 'GET',
  handler: FeedbackStatisticHandler.getFeedbackStatisticsForAdmin,
  options: {
    description: 'returns feedback statistics',
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
    },
  },
};

export default route;
