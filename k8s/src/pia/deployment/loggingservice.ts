/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import assert from 'assert';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { QPiaService } from '../stateful/qpiaservice';
import { Authserver } from './authserver';
import { UserService } from './userservice';
import { NodeJSService } from '../generic/nodejsservice';

export class LoggingService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      qpiaService,
      authServer,
      userService,
    }: {
      qpiaService: QPiaService;
      authServer: Authserver;
      userService: UserService;
    }
  ) {
    // assert routing name because it is hardcoded inside the loggingservice
    assert.strictEqual(authServer.service.name, 'authserver');

    super(scope, configuration, 'loggingservice', {
      WEBAPP_URL: configuration.variables.webappUrl,

      AUTHSERVER_PORT: authServer.service.port,
      AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver.adminTokenIntrospectionClientSecret,

      DB_LOG_PASSWORD: configuration.variables.logPassword,
      DB_LOG_USER: configuration.variables.logUser,
      DB_LOG_HOST: qpiaService.service.name,
      DB_LOG_PORT: qpiaService.service.port,
      DB_LOG_DB: configuration.variables.qpia.db,
      USERSERVICE_HOST: userService.internalService.name,
      USERSERVICE_INTERNAL_PORT: userService.internalService.port,
    });
  }
}
