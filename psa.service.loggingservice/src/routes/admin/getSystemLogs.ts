/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { SystemLogHandler } from '../../handlers/systemLogHandler';

const route: ServerRoute = {
  path: '/admin/systemLogs',
  method: 'GET',
  handler: SystemLogHandler.getSystemLogs,
  options: {
    description: 'returns log list for sysadmin filtered by query params',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:SysAdmin',
    },
    tags: ['api'],
    validate: {
      query: Joi.object({
        fromTime: Joi.date()
          .description('begin of the time interval you want to search')
          .empty('')
          .default(new Date(0)),
        toTime: Joi.date()
          .description('the end of the time interval you want to search')
          .empty('')
          .default(() => new Date()),
        types: Joi.array()
          .items(
            Joi.string().valid(
              'sample',
              'study',
              'study_change',
              'proband',
              'partial',
              'compliance',
              'personal'
            )
          )
          .description('an array with log types that should be returned')
          .required()
          .single(),
      }).unknown(),
    },
  },
};

export default route;
