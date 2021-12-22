/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import Hapi from '@hapi/hapi';
import {
  MailService,
  registerAuthStrategies,
  registerPlugins,
} from '@pia/lib-service-core';
import packageJson from '../package.json';
import { connectDatabase, db } from './db';
import { config } from './config';
import { getConnection } from 'typeorm';
import * as passwordDeletionTask from './services/passwordDeletionTask';
import { Job } from 'node-schedule';
import { messageQueueService } from './services/messageQueueService';

export class Server {
  private static instance: Hapi.Server;
  private static instanceInternal: Hapi.Server;
  private static passwordDeletionSchedule: Job;

  public static async init(): Promise<void> {
    await messageQueueService.connect();
    await connectDatabase();

    this.instance = Hapi.server({
      host: config.public.host,
      port: config.public.port,
      tls: config.public.tls,
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
          await getConnection().query('SELECT 1');
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

    await registerAuthStrategies(this.instance, {
      strategies: ['jwt', 'jwt_login'],
      publicAuthKey: config.publicAuthKey,
      db: db,
    });
    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
      routes: 'src/routes/*',
    });
    await registerPlugins(this.instanceInternal, {
      name: packageJson.name,
      version: packageJson.version,
      routes: 'src/routes/internal/*',
      isInternal: true,
    });

    MailService.initService(config.servers.mailserver);

    await this.instance.start();
    this.instance.log(
      ['startup'],
      `Server running at ${this.instance.info.uri}`
    );
    this.instance.log(['startup'], {
      ipCheckEnabled: config.ipCheckEnabled,
      certCheckEnabled: config.certCheckEnabled,
    });
    await this.instanceInternal.start();
    this.instanceInternal.log(
      ['startup'],
      `InternalServer running at ${this.instanceInternal.info.uri}`
    );

    // start scheduled jobs
    this.passwordDeletionSchedule =
      passwordDeletionTask.schedulePasswordDeletion();
  }

  public static async stop(): Promise<void> {
    this.passwordDeletionSchedule.cancel();
    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
    await this.instanceInternal.stop();
    this.instanceInternal.log(['startup'], `Internal Server was stopped`);

    await messageQueueService.disconnect();
  }
}
