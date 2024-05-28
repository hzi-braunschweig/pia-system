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
import { QuestionnaireService } from './questionnaireservice';

export class FeedbackStatisticService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      userService,
      qpiaService,
      messageQueue,
      authServer,
      questionnaireService,
    }: {
      userService: UserService;
      qpiaService: QPiaService;
      messageQueue: MessageQueue;
      authServer: Authserver;
      questionnaireService: QuestionnaireService;
    }
  ) {
    super(scope, configuration, 'feedbackstatisticservice', {
      DB_FEEDBACKSTATISTIC_HOST: qpiaService.service.name,
      DB_FEEDBACKSTATISTIC_PORT: qpiaService.service.port,
      DB_FEEDBACKSTATISTIC_USER: configuration.variables.feedbackStatisticUser,
      DB_FEEDBACKSTATISTIC_PASSWORD:
        configuration.variables.feedbackStatisticPassword,
      DB_FEEDBACKSTATISTIC_DB: configuration.variables.qpia.db,

      QUESTIONNAIRESERVICE_HOST: questionnaireService.internalService.name,
      QUESTIONNAIRESERVICE_INTERNAL_PORT:
        questionnaireService.internalService.port,

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
