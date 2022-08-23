/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';

import { registerAuthStrategies, registerPlugins } from '../../src';
import { config } from './config';

export class Server {
  public static instance: Hapi.Server | undefined;

  public static async init(): Promise<void> {
    Server.instance = new Hapi.Server({
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
        healthcheck: async (): Promise<boolean> => {
          return Promise.resolve(true);
        },
      },
    });

    await registerAuthStrategies(Server.instance, config.servers.authserver);
    await registerPlugins(Server.instance, {
      name: 'exampleservice',
      version: '1.0.0',
      routes: './tests/example-service/routes/*.ts',
    });

    await Server.instance.start();
    Server.instance.log(
      ['startup'],
      `Server running at ${Server.instance.info.uri}`
    );
  }

  public static async stop(): Promise<void> {
    await Server.instance?.stop();
    Server.instance?.log(['startup'], `Server was stopped`);
  }
}
