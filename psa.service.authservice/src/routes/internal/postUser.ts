/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';
import { AccountHandler } from '../../handlers/internal/accountHandler';

const route: ServerRoute = {
  path: '/auth/user',
  method: 'POST',
  handler: AccountHandler.createAccount,
  options: {
    description: 'creates a new user',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
        role: Joi.string()
          .valid(
            'Proband',
            'Forscher',
            'ProbandenManager',
            'EinwilligungsManager',
            'Untersuchungsteam'
          )
          .required(),
        pwChangeNeeded: Joi.boolean().required(),
        initialPasswordValidityDate: Joi.date().optional(),
      }).unknown(false),
    },
  },
};

export default route;
