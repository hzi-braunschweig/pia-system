/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';

import { ErrorHandler, Health, Metrics, Server } from '@pia/lib-service-core';
import { config } from './config';
import {
  MessageQueueService,
  MessageQueueServiceFactory,
} from './services/messageQueueService';
import { probandAuthClient } from './clients/authServerClient';

export class AuthEventProxyServer implements Server {
  private readonly hapi: Hapi.Server;
  private readonly messageQueueService: MessageQueueService;

  public constructor() {
    this.messageQueueService = MessageQueueServiceFactory(
      config.servers.messageQueue
    );
    this.hapi = Hapi.server({
      host: config.public.host,
      port: config.public.port,
      routes: {
        cors: { origin: ['*'] },
        timeout: {
          socket: false,
          server: false,
        },
      },
      app: {
        healthcheck: async () =>
          Promise.resolve(
            this.messageQueueService.isConnected() &&
              probandAuthClient.isConnected()
          ),
      },
    });
  }

  public async init(): Promise<void> {
    await this.hapi.register([Metrics, Health, ErrorHandler]);

    await this.messageQueueService.connect();
    await this.hapi.start();

    this.hapi.log(['startup'], `Server running at ${this.hapi.info.uri}`);

    return Promise.resolve();
  }

  public async stop(): Promise<void> {
    await this.hapi.stop();
    this.hapi.log(['startup'], `Server was stopped`);
    await this.messageQueueService.disconnect();
  }

  public async terminate(): Promise<void> {
    return Promise.resolve();
  }
}
