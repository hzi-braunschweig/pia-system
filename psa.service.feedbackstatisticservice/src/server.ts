/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import { getConnection } from 'typeorm';
import {
  Connection,
  defaultPublicRoutesPaths,
  registerAuthStrategies,
  registerPlugins,
} from '@pia/lib-service-core';

import packageJson from '../package.json';
import { connectDatabase } from './db';
import { config } from './config';
import { messageQueueService } from './services/messageQueueService';
import { TaskScheduler } from './services/taskScheduler';

export class Server {
  private static instance: Hapi.Server;

  public static async init(): Promise<void> {
    await connectDatabase();

    this.instance = Hapi.server(this.extractServerOptions(config.public));

    await registerAuthStrategies(this.instance, config.servers.authserver);
    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });

    await this.instance.start();
    this.instance.log(
      ['startup'],
      `Server running at ${this.instance.info.uri}`
    );

    await messageQueueService.connect();

    TaskScheduler.init();
  }

  public static async stop(): Promise<void> {
    TaskScheduler.stop();

    await messageQueueService.disconnect();

    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
  }

  private static extractServerOptions(
    connection: Connection
  ): Hapi.ServerOptions {
    return {
      host: connection.host,
      port: connection.port,
      routes: {
        cors: { origin: ['*'] },
        timeout: {
          socket: false,
          server: false,
        },
      },
      app: {
        healthcheck: async (): Promise<boolean> => {
          await getConnection().query('SELECT 1');
          return true;
        },
      },
    };
  }
}
