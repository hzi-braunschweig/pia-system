/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ServerRoute } from '@hapi/hapi';
import Joi from 'joi';

import { UsersHandler } from '../../handlers/usersHandler';
import { professionalRoles } from '../../models/role';

const route: ServerRoute = {
  path: '/admin/accounts',
  method: 'GET',
  handler: UsersHandler.getProfessionalAccounts,
  options: {
    description:
      'get all professional accounts with the same role as a requester',
    auth: {
      strategy: 'jwt-admin',
      scope: [
        'realm:ProbandenManager',
        'realm:Untersuchungsteam',
        'realm:Forscher',
        'realm:SysAdmin',
      ],
    },
    tags: ['api'],
    validate: {
      query: Joi.object({
        studyName: Joi.string().description(
          'the name of the study. Must not be null if requester is not a SysAdmin.'
        ),
        role: Joi.string()
          .description(
            'the role to filter by. Takes effect only for SysAdmins. Will return only accounts of same role for non SysAdmins.'
          )
          .valid(...professionalRoles),
        accessLevel: Joi.string()
          .description('the access level to filter by')
          .valid('read', 'write', 'admin'),
        onlyMailAddresses: Joi.boolean()
          .description('filters usernames which are no valid mail address')
          .default(false),
        filterSelf: Joi.boolean()
          .description('filters own user from results')
          .default(false),
      }).unknown(),
    },
  },
};

export default route;
