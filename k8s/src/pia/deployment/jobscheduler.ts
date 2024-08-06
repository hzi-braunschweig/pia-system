/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Construct } from 'constructs';
import { Configuration } from '../../configuration';
import { NodeJSService } from '../generic/nodejsservice';
import { MessageQueue } from '../stateful/messagequeue';

export class JobScheduler extends NodeJSService {
  public constructor(
    scope: Construct,
    configuration: Configuration,
    {
      messageQueue,
    }: {
      messageQueue: MessageQueue;
    }
  ) {
    super(
      scope,
      configuration,
      'jobscheduler',
      {
        MESSAGEQUEUE_HOST: messageQueue.service.name,
        MESSAGEQUEUE_PORT: messageQueue.service.port,
        MESSAGEQUEUE_APP_PASSWORD:
          configuration.variables.messageQueue.appPassword,
        MESSAGEQUEUE_APP_USER: configuration.variables.messageQueue.appUser,
      },
      {
        image: 'psa.server.jobscheduler',
        // the job scheduler cannot be scaled, as the messages starting jobs would be sent multiple times
        replicas: 1,
      }
    );
  }
}
