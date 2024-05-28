/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { SampleTrackingService } from './sampletrackingservice';
import { UserService } from './userservice';
import { QPiaService } from '../stateful/qpiaservice';
import { LoggingService } from './loggingservice';
import { MessageQueue } from '../stateful/messagequeue';
import { Authserver } from './authserver';
import { ComplianceService } from './complianceservice';

export class QuestionnaireService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      userService,
      qpiaService,
      complianceService,
      sampleTrackingService,
      loggingService,
      messageQueue,
      authServer,
    }: {
      userService: UserService;
      qpiaService: QPiaService;
      complianceService: ComplianceService;
      sampleTrackingService: SampleTrackingService;
      loggingService: LoggingService;
      messageQueue: MessageQueue;
      authServer: Authserver;
    }
  ) {
    super(scope, configuration, 'questionnaireservice', {
      LOGGINGSERVICE_HOST: loggingService.internalService.name,
      LOGGINGSERVICE_INTERNAL_PORT: loggingService.internalService.port,

      USERSERVICE_HOST: userService.internalService.name,
      USERSERVICE_INTERNAL_PORT: userService.internalService.port,

      COMPLIANCESERVICE_HOST: complianceService.internalService.name,
      COMPLIANCESERVICE_INTERNAL_PORT: complianceService.internalService.port,

      SAMPLETRACKINGSERVICE_HOST: sampleTrackingService.internalService.name,
      SAMPLETRACKINGSERVICE_INTERNAL_PORT:
        sampleTrackingService.internalService.port,

      MESSAGEQUEUE_HOST: messageQueue.service.name,
      MESSAGEQUEUE_PORT: messageQueue.service.port,
      MESSAGEQUEUE_APP_PASSWORD:
        configuration.variables.messageQueue.appPassword,
      MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,

      QPIA_HOST: qpiaService.service.name,
      QPIA_PORT: qpiaService.service.port,
      QPIA_USER: configuration.variables.qpia.user,
      QPIA_PASSWORD: configuration.variables.qpia.password,
      QPIA_DB: configuration.variables.qpia.db,

      AUTHSERVER_PORT: authServer.service.port,
      AUTHSERVER_PROBAND_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver
          .probandTokenIntrospectionClientSecret,
      AUTHSERVER_ADMIN_TOKEN_INTROSPECTION_CLIENT_SECRET:
        configuration.variables.authserver.adminTokenIntrospectionClientSecret,
    });
  }
}
