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
} from '@pia/lib-service-core';

import * as packageJson from '../package.json';
import { connectDatabase, db } from './db';
import { config } from './config';
import { TaskScheduleHelper } from './services/taskScheduleHelper';
import { LabResultImportHelper } from './services/labResultImportHelper';
import { getConnection } from 'typeorm';
import { RegisterRoutes as RegisterInternalRoutes } from './internalRoutes.generated';

interface Cancelable {
  cancel: () => void;
}

export class Server {
  private static instance: Hapi.Server;
  private static instanceInternal: Hapi.Server;

  private static csvImportJob: Cancelable;
  private static hl7ImportJob: Cancelable;

  public static async init(): Promise<void> {
    await connectDatabase();

    this.instance = Hapi.server(this.extractServerOptions(config.public));

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

    await registerAuthStrategies(this.instance, config.servers.authserver);
    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });
    await registerPlugins(this.instanceInternal, {
      name: packageJson.name,
      version: packageJson.version,
    });
    RegisterInternalRoutes(this.instanceInternal);

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
    await this.instanceInternal.stop();
    this.instanceInternal.log(['startup'], `Internal Server was stopped`);
  }

  private static extractServerOptions(
    connection: Connection
  ): Hapi.ServerOptions {
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
          await getConnection().query('SELECT 1');

          return true;
        },
      },
    };
  }
}
