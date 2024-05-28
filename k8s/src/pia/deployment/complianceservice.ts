/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { UserService } from './userservice';
import { MessageQueue } from '../stateful/messagequeue';
import { Authserver } from './authserver';
import { EwPiaService } from '../stateful/ewpiaservice';

export class ComplianceService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      userService,
      ewpiaService,
      messageQueue,
      authServer,
    }: {
      userService: UserService;
      ewpiaService: EwPiaService;
      messageQueue: MessageQueue;
      authServer: Authserver;
    }
  ) {
    super(scope, configuration, 'complianceservice', {
      WEBAPP_URL: configuration.variables.webappUrl,
      DEFAULT_LANGUAGE: configuration.variables.defaultLanguage,

      USERSERVICE_HOST: userService.internalService.name,
      USERSERVICE_INTERNAL_PORT: userService.internalService.port,

      MESSAGEQUEUE_HOST: messageQueue.service.name,
      MESSAGEQUEUE_PORT: messageQueue.service.port,
      MESSAGEQUEUE_APP_PASSWORD:
        configuration.variables.messageQueue.appPassword,
      MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,

      EWPIA_HOST: ewpiaService.service.name,
      EWPIA_PORT: ewpiaService.service.port,
      EWPIA_USER: configuration.variables.ewpia.user,
      EWPIA_PASSWORD: configuration.variables.ewpia.password,
      EWPIA_DB: configuration.variables.ewpia.db,

      AUTHSERVER_PORT: authServer.service.port,
      AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver
          .probandTokenIntrospectionClientSecret,
      AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver.adminTokenIntrospectionClientSecret,
    });
  }
}
