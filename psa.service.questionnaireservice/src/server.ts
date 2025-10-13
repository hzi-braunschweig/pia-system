/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import { RegisterRoutes } from './publicRoutes.generated';
import {
  defaultInternalRoutesPaths,
  defaultPublicRoutesPaths,
  registerAuthStrategies,
  registerPlugins,
} from '@pia/lib-service-core';
import packageJson from '../package.json';
import { connectDatabase, dataSource, dataSourceExport, db } from './db';
import { config } from './config';
import { messageQueueService } from './services/messageQueueService';
import { registerPayloadAuthStrategy } from './auth';

export class Server {
  private static instance: Hapi.Server;
  private static instanceInternal: Hapi.Server;

  public static async init(): Promise<void> {
    await connectDatabase();
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
          await db.one('SELECT 1;');
          await dataSource.query('SELECT 1');
          await dataSourceExport.query('SELECT 1');
          return messageQueueService.isConnected();
        },
      },
    });

    this.instanceInternal = Hapi.server({
      host: config.internal.host,
      port: config.internal.port,
      routes: {
        cors: { origin: ['*'] },
        timeout: {
          socket: false,
          server: false,
        },
      },
    });

    await messageQueueService.connect();

    registerPayloadAuthStrategy(this.instance);
    await registerAuthStrategies(this.instance, config.servers.authserver);
    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });
    await registerPlugins(this.instanceInternal, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultInternalRoutesPaths,
      isInternal: true,
    });

    RegisterRoutes(this.instance);

    await this.instance.start();
    this.instance.log(
      ['startup'],
      `Server running at ${this.instance.info.uri}`
    );
    await this.instanceInternal.start();
    this.instanceInternal.log(
      ['startup'],
      `InternalServer running at ${this.instanceInternal.info.uri}`
    );
  }

  public static async stop(): Promise<void> {
    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
    await this.instanceInternal.stop();
    this.instanceInternal.log(['startup'], `Internal Server was stopped`);
    await messageQueueService.disconnect();
  }

  public static getInstanceForTesting(): Hapi.Server {
    if (process.env['NODE_ENV'] === 'test') {
      return this.instance;
    }
    throw new Error('This method can only be used in test environment');
  }
}
