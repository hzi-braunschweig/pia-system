/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import assert from 'assert';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { MessageQueue } from '../stateful/messagequeue';
import { Authserver } from './authserver';
import { LoggingService } from './loggingservice';
import { UserService } from './userservice';
import { IPiaService } from '../stateful/ipiaservice';
import { NodeJSService } from '../generic/nodejsservice';

export class PersonaldataService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      ipiaService,
      messageQueue,
      authServer,
      loggingService,
      userService,
    }: {
      ipiaService: IPiaService;
      messageQueue: MessageQueue;
      authServer: Authserver;
      loggingService: LoggingService;
      userService: UserService;
    }
  ) {
    // assert routing name because it is hardcoded inside the personaldataservice
    assert.strictEqual(authServer.service.name, 'authserver');

    super(scope, configuration, 'personaldataservice', {
      WEBAPP_URL: configuration.variables.webappUrl,

      LOGGINGSERVICE_HOST: loggingService.internalService.name,
      LOGGINGSERVICE_INTERNAL_PORT: loggingService.internalService.port,

      USERSERVICE_HOST: userService.internalService.name,
      USERSERVICE_INTERNAL_PORT: userService.internalService.port,

      MAIL_HOST: configuration.variables.mail.host,
      MAIL_PORT: configuration.variables.mail.port,
      MAIL_USER: configuration.variables.mail.user,
      MAIL_PASSWORD: configuration.variables.mail.password,
      MAIL_REQUIRE_TLS: configuration.variables.mail.requireTls,
      MAIL_FROM_ADDRESS: configuration.variables.mail.fromAddress,
      MAIL_FROM_NAME: configuration.variables.mail.fromName,

      MESSAGEQUEUE_HOST: messageQueue.service.name,
      MESSAGEQUEUE_PORT: messageQueue.service.port,
      MESSAGEQUEUE_APP_PASSWORD:
        configuration.variables.messageQueue.appPassword,
      MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,
      AUTHSERVER_PORT: authServer.service.port,

      AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver.adminTokenIntrospectionClientSecret,

      AUTHSERVER_PROBAND_MANAGEMENT_CLIENT_SECRET:
        configuration.variables.authserver.probandManagementClientSecret,

      DB_PERSONALDATA_HOST: ipiaService.service.name,
      DB_PERSONALDATA_PORT: ipiaService.service.port,
      DB_PERSONALDATA_USER: configuration.variables.personaldataUser,
      DB_PERSONALDATA_PASSWORD: configuration.variables.personaldataPassword,
      DB_PERSONALDATA_DB: configuration.variables.ipia.db,
    });
  }
}
