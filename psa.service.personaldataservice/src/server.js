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
const { MailService } = require('@pia/lib-service-core');

let server;
let serverInternal;

exports.init = async () => {
  server = Hapi.server(extractServerOptions(config.public));
  serverInternal = Hapi.server(extractServerOptions(config.internal));

  await registerAuthStrategies(server, {
    strategies: ['jwt'],
    publicAuthKey: config.publicAuthKey,
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

  MailService.initService(config.servers.mailserver);

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);
  await serverInternal.start();
  serverInternal.log(
    ['startup'],
    `InternalServer running at ${serverInternal.info.uri}`
  );
};

exports.stop = async () => {
  await server.stop();
  server.log(['startup'], `Server was stopped`);
  await serverInternal.stop();
  serverInternal.log(['startup'], `Internal server was stopped`);
};

function extractServerOptions(connection) {
  return {
    host: connection.host,
    port: connection.port,
    tls: connection.tls,
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
  };
}
