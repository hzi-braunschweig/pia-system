/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi, { ServerOptions } from '@hapi/hapi';
import packageJson from '../package.json';

import { config } from './config';
import { db } from './db';
import {
  Connection,
  defaultInternalRoutesPaths,
  defaultPublicRoutesPaths,
  MailService,
  registerAuthStrategies,
  registerPlugins,
} from '@pia/lib-service-core';
import { messageQueueService } from './services/messageQueueService';
import { probandAuthClient } from './clients/authServerClient';
import { RegisterRoutes } from './publicRoutes.generated';

export class Server {
  private static instance: Hapi.Server;
  private static instanceInternal: Hapi.Server;

  public static async init(): Promise<void> {
    this.instance = Hapi.server(this.extractServerOptions(config.public));
    this.instanceInternal = Hapi.server(
      this.extractServerOptions(config.internal)
    );

    await messageQueueService.connect();

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

    MailService.initService(config.servers.mailserver);

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
    this.instanceInternal.log(['startup'], `Internal server was stopped`);
    await messageQueueService.disconnect();
  }

  private static extractServerOptions(connection: Connection): ServerOptions {
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
          await db.one('SELECT 1;');
          return (
            probandAuthClient.isConnected() && messageQueueService.isConnected()
          );
        },
      },
    };
  }
}
