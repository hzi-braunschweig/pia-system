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
const I18n = require('@pia/lib-hapi-i18n-plugin');

const packageJson = require('../package.json');
const { sequelize } = require('./db');
const { config } = require('./config');
const templatePipelineService = require('./services/pdfGeneratorService');
const { messageQueueService } = require('./services/messageQueueService');

let server;
let serverInternal;

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
        await sequelize.query('SELECT 1;');
        return messageQueueService.isConnected();
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
    strategies: ['jwt'],
    publicAuthKey: config.publicAuthKey,
  });
  await registerPlugins(server, {
    name: packageJson.name,
    version: packageJson.version,
    routes: 'src/routes/*',
  });
  await registerPlugins(serverInternal, {
    name: packageJson.name,
    version: packageJson.version,
    routes: 'src/routes/internal/*',
    isInternal: true,
  });

  await server.register({
    plugin: I18n,
    options: {
      defaultLocale: config.defaultLanguage,
      locales: ['en-US', 'de-DE'],
      directory: __dirname + '/../resources/i18n',
      updateFiles: false,
    },
  });

  await messageQueueService.connect();
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
  await templatePipelineService.stop();
  await messageQueueService.disconnect();
};
