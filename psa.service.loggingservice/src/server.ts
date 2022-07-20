/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import {
  Connection,
  defaultInternalRoutesPaths,
  defaultPublicRoutesPaths,
  registerAuthStrategies,
  registerPlugins,
  SecureConnection,
} from '@pia/lib-service-core';

import packageJson from '../package.json';
import { db } from './db';
import { config } from './config';

export class Server {
  private static instance: Hapi.Server;
  private static instanceInternal: Hapi.Server;

  public static async init(): Promise<void> {
    this.instance = Hapi.server(this.extractServerOptions(config.public));
    this.instanceInternal = Hapi.server(
      this.extractServerOptions(config.internal)
    );

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
  }

  private static extractServerOptions(
    connection: Connection | SecureConnection
  ): Hapi.ServerOptions {
    return {
      host: connection.host,
      port: connection.port,
      tls: 'tls' in connection ? connection.tls : false,
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
          return true;
        },
      },
    };
  }
}
