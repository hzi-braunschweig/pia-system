/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Hapi from '@hapi/hapi';
import { registerPlugins } from '@pia/lib-service-core';
import { config } from './config';
import * as packageJson from '../package.json';
import { TaskScheduler } from './services/taskScheduler';

export class Server {
  private static instance: Hapi.Server;

  public static async init(): Promise<void> {
    this.instance = new Hapi.Server({
      host: config.public.host,
      port: config.public.port,
      tls: config.public.tls,
      app: {
        healthcheck: async (): Promise<boolean> => {
          return Promise.resolve(true);
        },
      },
    });

    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
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
  }
}
