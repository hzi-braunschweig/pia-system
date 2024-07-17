/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { PendingDeletionsHandler } from '../../handlers/pendingDeletionsHandler';
import { ServerRoute } from '@hapi/hapi';

const route: ServerRoute = {
  path: '/personal/studies/{studyName}/pendingdeletions',
  method: 'GET',
  handler: PendingDeletionsHandler.getAllOfStudy,
  options: {
    description: 'get all the pending deletions in a study',
    tags: ['api'],
    validate: {
      params: Joi.object({
        studyName: Joi.string().description('the name of the study').required(),
      }).unknown(false),
    },
  },
};

export default route;
