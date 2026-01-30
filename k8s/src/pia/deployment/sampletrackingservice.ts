/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { UserService } from './userservice';
import { QPiaService } from '../stateful/qpiaservice';
import { MessageQueue } from '../stateful/messagequeue';
import { Authserver } from './authserver';
import { ComplianceService } from './complianceservice';

export class SampleTrackingService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      userService,
      qpiaService,
      complianceService,
      messageQueue,
      authServer,
    }: {
      userService: UserService;
      qpiaService: QPiaService;
      complianceService: ComplianceService;
      messageQueue: MessageQueue;
      authServer: Authserver;
    }
  ) {
    super(scope, configuration, 'sampletrackingservice', {
      QPIA_HOST: qpiaService.service.name,
      QPIA_PORT: qpiaService.service.port,
      QPIA_USER: configuration.variables.qpia.user,
      QPIA_PASSWORD: configuration.variables.qpia.password,
      QPIA_DB: configuration.variables.qpia.db,

      WEBAPP_URL: configuration.variables.webappUrl,

      COMPLIANCESERVICE_HOST: complianceService.internalService.name,
      COMPLIANCESERVICE_INTERNAL_PORT: complianceService.internalService.port,

      USERSERVICE_HOST: userService.internalService.name,
      USERSERVICE_INTERNAL_PORT: userService.internalService.port,

      MESSAGEQUEUE_HOST: messageQueue.service.name,
      MESSAGEQUEUE_PORT: messageQueue.service.port,
      MESSAGEQUEUE_APP_PASSWORD:
        configuration.variables.messageQueue.appPassword,
      MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,

      AUTHSERVER_PORT: authServer.service.port,
      AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver
          .probandTokenIntrospectionClientSecret,
      AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver.adminTokenIntrospectionClientSecret,
    });
  }
}
