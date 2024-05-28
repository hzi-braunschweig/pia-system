/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Hapi from '@hapi/hapi';

import {
  defaultPublicRoutesPaths,
  registerAuthStrategies,
  registerPlugins,
  Server,
} from '@pia/lib-service-core';
import packageJson from '../package.json';
import { config } from './config';
import { adminAuthClient } from './clients/authServerClient';

export class PublicApiServer implements Server {
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
        healthcheck: async () => Promise.resolve(adminAuthClient.isConnected()),
      },
    });
  }

  public async init(): Promise<void> {
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

    return Promise.resolve();
  }

  public async stop(): Promise<void> {
    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
  }

  public async terminate(): Promise<void> {
    return Promise.resolve();
  }
}
