/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import assert from 'assert';
import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { MessageQueue } from '../stateful/messagequeue';
import { QPiaService } from '../stateful/qpiaservice';
import { Authserver } from './authserver';
import { NodeJSService } from '../generic/nodejsservice';
import { IService } from '../../k8s/service';

export class UserService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      qpiaService,
      messageQueue,
      authServer,
      loggingServiceService,
      personalDataServiceService,
    }: {
      qpiaService: QPiaService;
      messageQueue: MessageQueue;
      authServer: Authserver;
      loggingServiceService: IService;
      personalDataServiceService: IService;
    }
  ) {
    // assert routing name because it is hardcoded inside the userservice
    assert.strictEqual(authServer.service.name, 'authserver');

    super(scope, configuration, 'userservice', {
      WEBAPP_URL: configuration.variables.webappUrl,
      USER_PASSWORD_LENGTH: configuration.variables.userPasswordLength,
      LOGGINGSERVICE_HOST: loggingServiceService.name,
      LOGGINGSERVICE_INTERNAL_PORT: loggingServiceService.port,
      PERSONALDATASERVICE_HOST: personalDataServiceService.name,
      PERSONALDATASERVICE_INTERNAL_PORT: personalDataServiceService.port,
      QPIA_HOST: qpiaService.service.name,
      QPIA_PORT: qpiaService.service.port,
      QPIA_USER: configuration.variables.qpia.user,
      QPIA_PASSWORD: configuration.variables.qpia.password,
      QPIA_DB: configuration.variables.qpia.db,
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
      AUTHSERVER_PROBAND_MANAGEMENT_CLIENT_SECRET:
        configuration.variables.authserver.probandManagementClientSecret,
      AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver
          .probandTokenIntrospectionClientSecret,
      AUTHSERVER_ADMIN_MANAGEMENT_CLIENT_SECRET:
        configuration.variables.authserver.adminManagementClientSecret,
      AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver.adminTokenIntrospectionClientSecret,
      IS_DEVELOPMENT_SYSTEM: configuration.variables.isDevelopmentSystem,
    });
  }
}
