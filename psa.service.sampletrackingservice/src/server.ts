/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Hapi from '@hapi/hapi';
import {
  Connection,
  defaultPublicRoutesPaths,
  registerAuthStrategies,
  registerPlugins,
  SecureConnection,
} from '@pia/lib-service-core';

import * as packageJson from '../package.json';
import { connectDatabase, db } from './db';
import { config } from './config';
import { TaskScheduleHelper } from './services/taskScheduleHelper';
import { LabResultImportHelper } from './services/labResultImportHelper';
import { getConnection } from 'typeorm';

interface Cancelable {
  cancel: () => void;
}

export class Server {
  private static instance: Hapi.Server;

  private static csvImportJob: Cancelable;
  private static hl7ImportJob: Cancelable;

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

    // Start scheduled jobs
    this.csvImportJob = TaskScheduleHelper.scheduleDailyHL7Import();
    this.hl7ImportJob = TaskScheduleHelper.scheduleDailyCsvImport();
    await LabResultImportHelper.importHl7FromMhhSftp();
    await LabResultImportHelper.importCsvFromHziSftp();
  }

  public static async stop(): Promise<void> {
    this.csvImportJob.cancel();
    this.hl7ImportJob.cancel();

    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);
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
          await getConnection().query('SELECT 1');

          return true;
        },
      },
    };
  }
}
