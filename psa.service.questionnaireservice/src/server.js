const Hapi = require('@hapi/hapi');
const {
  registerPlugins,
  registerAuthStrategies,
} = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');

let server;

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
    routes: './src/routes/*.js',
  });

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);
};

exports.stop = async () => {
  await server.stop();
  server.log(['startup'], `Server was stopped`);
};
