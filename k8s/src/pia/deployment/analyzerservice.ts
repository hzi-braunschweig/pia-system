/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { QPiaService } from '../stateful/qpiaservice';
import { MessageQueue } from '../stateful/messagequeue';
import { QuestionnaireService } from './questionnaireservice';

export class AnalyzerService extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      qpiaService,
      messageQueue,
      questionnaireService,
    }: {
      qpiaService: QPiaService;
      messageQueue: MessageQueue;
      questionnaireService: QuestionnaireService;
    }
  ) {
    super(
      scope,
      configuration,
      'analyzerservice',
      {
        QUESTIONNAIRESERVICE_HOST: questionnaireService.internalService.name,
        QUESTIONNAIRESERVICE_INTERNAL_PORT:
          questionnaireService.internalService.port,

        QPIA_HOST: qpiaService.service.name,
        QPIA_PORT: qpiaService.service.port,
        QPIA_USER: configuration.variables.qpia.user,
        QPIA_PASSWORD: configuration.variables.qpia.password,
        QPIA_DB: configuration.variables.qpia.db,

        MESSAGEQUEUE_HOST: messageQueue.service.name,
        MESSAGEQUEUE_PORT: messageQueue.service.port,
        MESSAGEQUEUE_APP_PASSWORD:
          configuration.variables.messageQueue.appPassword,
        MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,
      },
      {
        // is currently not scalable because it is using a scheduler and listening for db events
        replicas: 1,
      }
    );
  }
}
