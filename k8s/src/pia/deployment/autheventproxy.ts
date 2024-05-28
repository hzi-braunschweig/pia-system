/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { MessageQueue } from '../stateful/messagequeue';
import { Authserver } from './authserver';

export class AuthEventProxy extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      messageQueue,
      authServer,
    }: {
      messageQueue: MessageQueue;
      authServer: Authserver;
    }
  ) {
    super(
      scope,
      configuration,
      'autheventproxy',
      {
        MESSAGEQUEUE_HOST: messageQueue.service.name,
        MESSAGEQUEUE_PORT: messageQueue.service.port,
        MESSAGEQUEUE_APP_PASSWORD:
          configuration.variables.messageQueue.appPassword,
        MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,

        AUTHSERVER_PORT: authServer.service.port,
        AUTHSERVER_PROBAND_MANAGEMENT_CLIENT_SECRET:
          configuration.variables.authserver.probandManagementClientSecret,
        AUTHSERVER_MESSAGEQUEUE_EXCHANGE:
          configuration.variables.authserver.messageQueueExchange,
      },
      {
        image: 'psa.server.autheventproxy',
      }
    );
  }
}
