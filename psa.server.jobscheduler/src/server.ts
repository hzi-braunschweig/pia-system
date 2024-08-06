/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';

import { ErrorHandler, Health, Metrics, Server } from '@pia/lib-service-core';
import { config } from './config';
import { messageQueueService } from './services/messageQueueService';
import { CronService } from './services/cronService';
import { CronTable } from './cronTable';

export class JobSchedulerServer implements Server {
  private readonly hapi: Hapi.Server;

  public constructor(private readonly cronService = new CronService()) {
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
          Promise.resolve(messageQueueService.isConnected()),
      },
    });
  }

  public async init(): Promise<void> {
    await this.hapi.register([Metrics, Health, ErrorHandler]);

    await messageQueueService.connect();
    await messageQueueService.setupProducers(CronTable);

    await this.hapi.start();
    this.hapi.log(['startup'], `Server running at ${this.hapi.info.uri}`);

    this.cronService.setup(CronTable);
    this.cronService.startAll();
  }

  public async stop(): Promise<void> {
    this.cronService.stopAll();
    await this.hapi.stop();
    await messageQueueService.disconnect();
    this.hapi.log(['startup'], `Server was stopped`);
  }
}
