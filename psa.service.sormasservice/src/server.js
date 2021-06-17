const Hapi = require('@hapi/hapi');
const {
  registerPlugins,
  registerAuthStrategies,
  ListeningDbClient,
} = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');
const notificationHandlers = require('./services/notificationHandlers.js');
const taskScheduleHelper = require('./services/taskScheduleHelper.js');
const questionnaireInstancesService = require('./services/questionnaireInstancesService.js');
const expiredUsersDeletionService = require('./services/expiredUsersDeletionService');

const sormasClient = require('./clients/sormasClient');

let server;
let serverInternal;
let questionnaireInstancesUploaderJob;
let listeningDbClient;

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
        return (await sormasClient.getApiVersion()) !== null;
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

  questionnaireInstancesUploaderJob =
    taskScheduleHelper.scheduleQuestionnaireInstancesUploader(db);

  await questionnaireInstancesService.checkAndUploadQuestionnaireInstances(db);
  /**
   * Deletion may take place while server loads, thus no await
   */
  expiredUsersDeletionService.checkAndDeleteExpiredUsers(db);

  listeningDbClient = new ListeningDbClient(db);
  listeningDbClient.on('connected', (client) =>
    registerDbNotifications(client)
  );
  await listeningDbClient.connect();

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
  await registerPlugins(serverInternal, {
    name: packageJson.name,
    version: packageJson.version,
    routes: './src/routes/internal/*.js',
    isInternal: true,
  });

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);
  await serverInternal.start();
  serverInternal.log(
    ['startup'],
    `InternalServer running at ${serverInternal.info.uri}`
  );
};

exports.stop = async () => {
  questionnaireInstancesUploaderJob.cancel();

  if (listeningDbClient) {
    await listeningDbClient.disconnect();
  }
  await server.stop();
  server.log(['startup'], `Server was stopped`);
  await serverInternal.stop();
  serverInternal.log(['startup'], `Internal server was stopped`);
};

exports.terminate = async () => {
  db.$pool.end();
};

async function registerDbNotifications(dbClient) {
  dbClient.on('notification', function (msg) {
    if (msg.name === 'notification') {
      const pl = JSON.parse(msg.payload);
      if (
        msg.channel === 'table_update' &&
        pl.table === 'questionnaire_instances'
      ) {
        notificationHandlers
          .handleUpdatedInstance(db, pl.row_old, pl.row_new)
          .catch(function (err) {
            console.log(err);
          });
      } else {
        return;
      }
      console.log(
        "Got '" + msg.channel + "' notification for table '" + pl.table + "'"
      );
    }
  });
  await dbClient.query('LISTEN table_update');
  console.log('now listening to DB notifications');
}
