/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';
import Vision from '@hapi/vision';
import Ejs from 'ejs';
import { MailService, registerPlugins } from '@pia/lib-service-core';
import * as packageJson from '../package.json';
import { config } from './config';
import { connectDatabase } from './db';
import { TaskScheduler } from './services/taskScheduler';
import { SormasClient } from './clients/sormasClient';
import { xAccessTokenSchema } from './auth/schemas/xAccessToken';
import { validateOneTimeTokenAuth } from './auth/strategies/validateOneTimeToken';
import { getConnection } from 'typeorm';
import { messageQueueService } from './services/messageQueueService';
import { plugin as I18n } from '@pia/lib-hapi-i18n-plugin';

export class Server {
  private static instance: Hapi.Server;

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
          try {
            await getConnection().query('SELECT 1');
            await SormasClient.getApiVersion();
          } catch (e) {
            console.error('HEALTHCHECK got an error:', e);
            return false;
          }
          return messageQueueService.isConnected();
        },
      },
    });

    await messageQueueService.connect();
    MailService.initService(config.servers.mailserver);

    this.instance.auth.scheme('x-access-token', xAccessTokenSchema);
    this.instance.auth.strategy('sormas-one-time-token', 'x-access-token', {
      validate: validateOneTimeTokenAuth,
    });

    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
      routes: 'src/routes/*',
    });

    await this.instance.register({
      plugin: I18n,
      options: {
        defaultLocale: config.defaultLanguage,
        locales: ['en-US', 'de-DE'],
        directory: __dirname + '/../resources/i18n',
      },
    });
    await this.instance.register(Vision);
    this.instance.views({
      engines: {
        ejs: Ejs,
      },
      isCached: false,
      path: './resources/views',
    });

    await this.instance.start();
    this.instance.log(
      ['startup'],
      `Server running at ${this.instance.info.uri}`
    );

    TaskScheduler.init();
  }

  public static async stop(): Promise<void> {
    TaskScheduler.stop();

    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
    await messageQueueService.disconnect();
  }
}
