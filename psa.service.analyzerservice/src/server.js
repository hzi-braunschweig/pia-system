const Hapi = require('@hapi/hapi');
const { registerPlugins, ListeningDbClient } = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');
const notificationHandlers = require('./services/notificationHandlers.js');
const taskScheduleHelper = require('./services/taskScheduleHelper.js');

let server;
let questionnaireInstancesActivatorJob;
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
        return true;
      },
    },
  });

  await registerPlugins(server, {
    name: packageJson.name,
    version: packageJson.version,
    routes: './src/routes/*.js',
  });

  await server.start();
  server.log(['startup'], `Server running at ${server.info.uri}`);

  questionnaireInstancesActivatorJob =
    taskScheduleHelper.scheduleQuestionnaireInstancesActivator(db);

  listeningDbClient = new ListeningDbClient(db);
  listeningDbClient.on('connected', (client) =>
    registerDbNotifications(client)
  );
  await listeningDbClient.connect();
};

exports.stop = async () => {
  questionnaireInstancesActivatorJob.cancel();
  await listeningDbClient.disconnect();
  await server.stop();
  server.log(['startup'], `Server was stopped`);
};

exports.terminate = async () => {
  db.$pool.end();
};

async function registerDbNotifications(client) {
  client.on('notification', async function (msg) {
    if (msg.name === 'notification') {
      try {
        const pl = JSON.parse(msg.payload);
        if (msg.channel === 'table_insert' && pl.table === 'questionnaires') {
          await notificationHandlers.handleInsertedQuestionnaire(db, pl.row);
        } else if (
          msg.channel === 'table_update' &&
          pl.table === 'questionnaires'
        ) {
          await notificationHandlers.handleUpdatedQuestionnaire(
            db,
            pl.row_old,
            pl.row_new
          );
        } else if (msg.channel === 'table_update' && pl.table === 'users') {
          await notificationHandlers.handleUpdatedUser(
            db,
            pl.row_old,
            pl.row_new
          );
        } else if (
          msg.channel === 'table_update' &&
          pl.table === 'questionnaire_instances'
        ) {
          await notificationHandlers.handleUpdatedInstance(
            db,
            pl.row_old,
            pl.row_new
          );
        } else if (
          msg.channel === 'table_insert' &&
          pl.table === 'study_users'
        ) {
          await notificationHandlers.handleInsertedStudyUser(db, pl.row);
        } else if (
          msg.channel === 'table_delete' &&
          pl.table === 'study_users'
        ) {
          await notificationHandlers.handleDeletedStudyUser(db, pl.row);
        } else {
          return;
        }
        console.log(
          "Processed '" +
            msg.channel +
            "' notification for table '" +
            pl.table +
            "'"
        );
      } catch (err) {
        console.error(err);
      }
    }
  });
  await client.query('LISTEN table_update');
  await client.query('LISTEN table_insert');
  await client.query('LISTEN table_delete');
}
