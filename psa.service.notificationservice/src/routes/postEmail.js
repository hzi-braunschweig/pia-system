/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const emailHandler = require('../handlers/emailHandler.js');

const Joi = require('joi');
module.exports = {
  path: '/notification/email',
  method: 'POST',
  handler: emailHandler.sendEmail,
  config: {
    description: 'posts an email',
    auth: 'jwt',
    tags: ['api'],
    validate: {
      payload: Joi.object({
        recipients: Joi.array()
          .items(Joi.string())
          .required()
          .description('the list with recipient pseudonyms')
          .default(['Dtest-9999999999']),
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
