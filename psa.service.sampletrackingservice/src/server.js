/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

const Hapi = require('@hapi/hapi');
const {
  registerPlugins,
  registerAuthStrategies,
} = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');
const taskScheduleHelper = require('./services/taskScheduleHelper');
const { LabResultImportHelper } = require('./services/labResultImportHelper');

let server;
let csvImportJob;
let hl7ImportJob;

exports.init = async () => {
  server = Hapi.server({
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

  await registerAuthStrategies(server, {
    strategies: ['jwt'],
    publicAuthKey: config.publicAuthKey,
    db: db,
  });
  await registerPlugins(server, {
    name: packageJson.name,
    version: packageJson.version,
    routes: 'src/routes/*',
  });

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);

  // Start scheduled jobs
  csvImportJob = taskScheduleHelper.scheduleDailyHL7Import();
  hl7ImportJob = taskScheduleHelper.scheduleDailyCsvImport();
  await LabResultImportHelper.importHl7FromMhhSftp();
  await LabResultImportHelper.importCsvFromHziSftp();
};

exports.stop = async () => {
  csvImportJob.cancel();
  hl7ImportJob.cancel();

  await server.stop();
  server.log(['startup'], `Server was stopped`);
};
