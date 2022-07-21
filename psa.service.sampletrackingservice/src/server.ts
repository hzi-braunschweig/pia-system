/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Hapi from '@hapi/hapi';
import {
  defaultPublicRoutesPaths,
  registerAuthStrategies,
  registerPlugins,
} from '@pia/lib-service-core';

import * as packageJson from '../package.json';
import { db } from './db';
import { config } from './config';
import taskScheduleHelper from './services/taskScheduleHelper';
import { LabResultImportHelper } from './services/labResultImportHelper';

interface Cancelable {
  cancel: () => void;
}

export class Server {
  private static server: Hapi.Server;

  private static csvImportJob: Cancelable;
  private static hl7ImportJob: Cancelable;

  public static async init(): Promise<void> {
    this.server = Hapi.server({
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
          return true;
        },
      },
    });

    await registerAuthStrategies(this.server, config.servers.authserver);
    await registerPlugins(this.server, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });

    await this.server.start();
    this.server.log(['startup'], `Server running at ${this.server.info.uri}`);

    // Start scheduled jobs
    this.csvImportJob =
      taskScheduleHelper.scheduleDailyHL7Import() as Cancelable;
    this.hl7ImportJob =
      taskScheduleHelper.scheduleDailyCsvImport() as Cancelable;
    await LabResultImportHelper.importHl7FromMhhSftp();
    await LabResultImportHelper.importCsvFromHziSftp();
  }

  public static async stop(): Promise<void> {
    this.csvImportJob.cancel();
    this.hl7ImportJob.cancel();

    await this.server.stop();
    this.server.log(['startup'], `Server was stopped`);
  }
}
