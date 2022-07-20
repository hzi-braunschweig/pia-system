/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { EmailHandler } from '../../handlers/emailHandler';

const route: ServerRoute = {
  path: '/admin/email',
  method: 'POST',
  handler: EmailHandler.sendEmail,
  options: {
    description: 'posts an email',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        recipients: Joi.array()
          .description('the list with recipient pseudonyms')
          .items(Joi.string().lowercase())
          .required()
          .default(['dtest-9999999999']),
        title: Joi.string()
          .required()
          .description('the subject line of the message')
          .default('Neue Studie zu PIA!!!'),
        body: Joi.string()
          .required()
          .description('the message content')
          .default(
            'Probanden Achtung, neue Studie fängt ab Morgen an. Bitte Meldet euch'
          ),
      }),
    },
    response: {
      schema: Joi.array()
        .items(Joi.string().email())
        .description('list of mails which were successfully sent'),
    },
  },
};

export default route;
