/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';

import { FeedbackStatisticHandler } from '../../handlers/feedbackStatisticHandler';

const route: ServerRoute = {
  path: '/',
  method: 'GET',
  handler: FeedbackStatisticHandler.getFeedbackStatisticsForProband,
  options: {
    description: 'returns feedback statistics',
    auth: {
      strategy: 'jwt-proband',
      scope: 'realm:Proband',
    },
    tags: ['api'],
  },
};

export default route;
