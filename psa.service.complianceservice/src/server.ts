/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import {
  registerPlugins,
  registerAuthStrategies,
  defaultInternalRoutesPaths,
  defaultPublicRoutesPaths,
} from '@pia/lib-service-core';
import packageJson from '../package.json';
import { config } from './config';
import { messageQueueService } from './services/messageQueueService';
import { sequelize } from './db';
import { plugin as i18nPlugin } from '@pia/lib-hapi-i18n-plugin';
import templatePipelineService from './services/pdfGeneratorService';

export class Server {
  private static server: Hapi.Server;
  private static serverInternal: Hapi.Server;

  public static async init(): Promise<void> {
    this.server = Hapi.server({
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
          await sequelize.query('SELECT 1;');
          return messageQueueService.isConnected();
        },
      },
    });

    this.serverInternal = Hapi.server({
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

    await registerAuthStrategies(this.server, config.servers.authserver);
    await registerPlugins(this.server, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });
    await registerPlugins(this.serverInternal, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultInternalRoutesPaths,
      isInternal: true,
    });

    await this.server.register({
      plugin: i18nPlugin,
      options: {
        defaultLocale: config.defaultLanguage,
        locales: ['en-US', 'de-DE'],
        directory: __dirname + '/../resources/i18n',
        updateFiles: false,
      },
    });

    await messageQueueService.connect();
    await this.server.start();
    this.server.log(
      ['startup'],
      `this.Server running at ${this.server.info.uri}`
    );
    await this.serverInternal.start();
    this.serverInternal.log(
      ['startup'],
      `InternalServer running at ${this.serverInternal.info.uri}`
    );
  }
  public static async stop(): Promise<void> {
    await this.server.stop();
    this.server.log(['startup'], `Server was stopped`);
    await this.serverInternal.stop();
    this.serverInternal.log(['startup'], `Internal server was stopped`);
    await templatePipelineService.stop();
    await messageQueueService.disconnect();
  }
}
