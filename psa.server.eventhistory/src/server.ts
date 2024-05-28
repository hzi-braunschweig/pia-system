/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import {
  registerPlugins,
  registerAuthStrategies,
  defaultPublicRoutesPaths,
  Server,
} from '@pia/lib-service-core';
import packageJson from '../package.json';
import { connectDatabase, dataSource } from './db';
import { config } from './config';
import { RegisterRoutes } from './publicRoutes.generated';
import { messageQueueService } from './services/messageQueueService';

export class EventHistoryServer implements Server {
  private readonly instance: Hapi.Server;

  public constructor() {
    this.instance = Hapi.server({
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
        healthcheck: async () => {
          return Promise.resolve(
            dataSource.isInitialized && messageQueueService.isConnected()
          );
        },
      },
    });
  }

  public async init(): Promise<void> {
    await connectDatabase();
    await messageQueueService.connect();

    await registerAuthStrategies(this.instance, config.servers.authserver);
    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });

    RegisterRoutes(this.instance);

    await this.instance.start();
    this.instance.log(
      ['startup'],
      `Server running at ${this.instance.info.uri}`
    );
  }

  public async stop(): Promise<void> {
    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
    await messageQueueService.disconnect();
    await dataSource.destroy();
  }

  public async terminate(): Promise<void> {
    return Promise.resolve();
  }
}
