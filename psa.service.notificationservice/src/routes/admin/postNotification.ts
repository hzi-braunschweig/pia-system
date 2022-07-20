/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Joi from 'joi';
import { ServerRoute } from '@hapi/hapi';

import { NotificationHandler } from '../../handlers/notificationHandler';

const route: ServerRoute = {
  path: '/admin/notification',
  method: 'POST',
  handler: NotificationHandler.postOne,
  options: {
    description: 'posts a notification',
    auth: {
      strategy: 'jwt-admin',
      scope: 'realm:ProbandenManager',
    },
    tags: ['api'],
    validate: {
      payload: Joi.object({
        title: Joi.string()
          .required()
          .description('the title of the notification')
          .default('Neue PIA Nachricht'),
        body: Joi.string()
          .required()
          .description('the body of the notification')
          .default('Es gibt wichtige Neuhigkeiten zu PIA!!!'),
        recipients: Joi.array()
          .items(Joi.string().lowercase())
          .description('the recipients usernames of the notification')
          .default('Testproband1'),
        date: Joi.date()
          .timestamp()
          .optional()
          .description('the date to send the notification on')
          .min('now'),
      }),
    },
  },
};

export default route;
