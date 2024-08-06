/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { MessageQueue } from '../stateful/messagequeue';
import { QPiaService } from '../stateful/qpiaservice';
import { Authserver } from './authserver';

export class EventHistoryServer extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      authServer,
      qpiaService,
      messageQueue,
    }: {
      authServer: Authserver;
      qpiaService: QPiaService;
      messageQueue: MessageQueue;
    }
  ) {
    super(
      scope,
      configuration,
      'eventhistoryserver',
      {
        DB_EVENTHISTORY_HOST: qpiaService.service.name,
        DB_EVENTHISTORY_PORT: qpiaService.service.port,
        DB_EVENTHISTORY_USER: configuration.variables.eventHistoryUser,
        DB_EVENTHISTORY_PASSWORD: configuration.variables.eventHistoryPassword,
        DB_EVENTHISTORY_DB: configuration.variables.qpia.db,

        MESSAGEQUEUE_HOST: messageQueue.service.name,
        MESSAGEQUEUE_PORT: messageQueue.service.port,
        MESSAGEQUEUE_APP_PASSWORD:
          configuration.variables.messageQueue.appPassword,
        MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,

        AUTHSERVER_PORT: authServer.service.port,
        AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
          configuration.variables.authserver
            .adminTokenIntrospectionClientSecret,
      },
      {
        image: 'psa.server.eventhistory',
      }
    );
  }
}
