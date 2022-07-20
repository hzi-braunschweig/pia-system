/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { InternalSystemLogHandler } from '../../handlers/internal/internalSystemLogHandler';

const route: ServerRoute = {
  path: '/log/systemLogs',
  method: 'POST',
  handler: InternalSystemLogHandler.postLog,
  options: {
    description: 'inserts a system log record',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        requestedBy: Joi.string().required(),
        requestedFor: Joi.string().required(),
        timestamp: Joi.date().optional(),
        type: Joi.string()
          .valid(
            'proband',
            'sample',
            'study',
            'compliance',
            'study_change',
            'partial',
            'personal'
          )
          .required(),
      }).unknown(),
    },
  },
};

export default route;
