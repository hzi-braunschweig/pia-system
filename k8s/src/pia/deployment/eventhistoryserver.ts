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
import { CronJob, ImagePullPolicy, Cpu, Volume } from 'cdk8s-plus-25';
import { Cron, Size, Duration } from 'cdk8s';

export class EventHistoryServer extends NodeJSService {
  public readonly removeOldEventsCronJob: CronJob;

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
    const databaseEnvVars = {
      DB_EVENTHISTORY_HOST: qpiaService.service.name,
      DB_EVENTHISTORY_PORT: qpiaService.service.port,
      DB_EVENTHISTORY_USER: configuration.variables.eventHistoryUser,
      DB_EVENTHISTORY_PASSWORD: configuration.variables.eventHistoryPassword,
      DB_EVENTHISTORY_DB: configuration.variables.qpia.db,
    };

    super(
      scope,
      configuration,
      'eventhistoryserver',
      {
        ...databaseEnvVars,

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

    this.removeOldEventsCronJob = new CronJob(this, 'remove-old-events', {
      schedule: Cron.daily(),
      // keep the last 2 days of jobs to be able to see their logs
      ttlAfterFinished: Duration.days(2),
      metadata: {
        ...configuration.getMetadata(),
        name: 'eventhistoryserver-remove-old-events',
      },
      podMetadata: configuration.getMetadata(),
      containers: [
        {
          image: configuration.getImage('psa.server.eventhistory'),
          args: ['npm', 'run', 'cli', '--', 'remove-old-events'],
          imagePullPolicy: ImagePullPolicy.IF_NOT_PRESENT,
          envVariables: configuration.getVariables({
            ...databaseEnvVars,
            // Stops errors being thrown, because of missing API configuration
            IGNORE_MISSING_CONFIG: '1',
            // Prevent npm update message to from spamming logs
            NO_UPDATE_NOTIFIER: '1',
          }),
          securityContext: {
            ...configuration.getDefaultSecurityContext(),
            user: 1000,
            group: 1000,
          },
          resources: {
            cpu: {
              request: Cpu.units(0.1),
              limit: Cpu.units(2),
            },
            memory: {
              request: Size.mebibytes(64),
              limit: Size.gibibytes(4),
            },
          },
          volumeMounts: [
            {
              path: '/home/node/.npm',
              volume: Volume.fromEmptyDir(
                this,
                'npm-dir-remove-old-events',
                'npm-dir-remove-old-events'
              ),
            },
          ],
        },
      ],
    });
  }
}
