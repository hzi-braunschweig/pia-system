/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import pendingComplianceChangesHandler from '../handlers/pendingComplianceChangesHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/user/studies/{studyName}/pendingcompliancechanges',
  method: 'GET',
  handler: pendingComplianceChangesHandler.getAllOfStudy,
  options: {
    description: 'get all the pending compliance changes in a study',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).unknown(false),
    },
  },
};

export default route;
