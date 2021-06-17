const Hapi = require('@hapi/hapi');
const { registerPlugins } = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { config } = require('./config');
const taskScheduleHelper = require('./services/taskScheduleHelper');
const modysImportService = require('./services/modysImportService');
const modysHelper = require('./dbModys');

let server;
let updatesFromModysJob;

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
        return await modysHelper.checkConnection();
      },
    },
  });

  await registerPlugins(server, {
    name: packageJson.name,
    version: packageJson.version,
  });

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);

  await modysImportService.updatePersonalData();
  updatesFromModysJob = taskScheduleHelper.scheduleUpdatesFromModys();
};

exports.stop = async () => {
  updatesFromModysJob.cancel();
  await server.stop();
  server.log(['startup'], `Server was stopped`);
};
