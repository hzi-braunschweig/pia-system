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
const Ejs = require('ejs');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');
const { MailService } = require('@pia/lib-service-core');
const passwordDeletionTask = require('./services/passwordDeletionTask');
const RequestLogger = require('./lib/plugins/requestLogger');

let server;
let serverInternal;
let passwordDeletionSchedule;

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

  serverInternal = Hapi.server({
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

  await registerAuthStrategies(server, {
    strategies: ['jwt', 'jwt_login', 'simple'],
    publicAuthKey: config.publicAuthKey,
    db: db,
    basicCredentials: {
      username: config.sormasOnPiaUser,
      password: config.sormasOnPiaPassword,
    },
  });
  await registerPlugins(server, {
    name: packageJson.name,
    version: packageJson.version,
    routes: './src/routes/*.js',
  });
  await registerPlugins(serverInternal, {
    name: packageJson.name,
    version: packageJson.version,
    routes: './src/routes/internal/*.js',
    isInternal: true,
  });

  await server.register(RequestLogger);
  server.views({
    engines: {
      ejs: Ejs,
    },
    isCached: false,
    path: './resources/views',
  });

  MailService.initService(config.servers.mailserver);

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);
  server.log(['startup'], {
    ipCheckEnabled: config.ipCheckEnabled,
    certCheckEnabled: config.certCheckEnabled,
  });

  await serverInternal.start();
  serverInternal.log(
    ['startup'],
    `InternalServer running at ${serverInternal.info.uri}`
  );

  // start scheduled jobs
  passwordDeletionSchedule = passwordDeletionTask.schedulePasswordDeletion();
};

exports.stop = async () => {
  passwordDeletionSchedule.cancel();
  await server.stop();
  server.log(['startup'], `Server was stopped`);
  await serverInternal.stop();
  serverInternal.log(['startup'], `Internal server was stopped`);
};
