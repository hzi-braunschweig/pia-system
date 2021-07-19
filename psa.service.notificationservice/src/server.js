const Hapi = require('@hapi/hapi');
const {
  registerPlugins,
  registerAuthStrategies,
  ListeningDbClient,
} = require('@pia/lib-service-core');

const packageJson = require('../package.json');
const { db } = require('./db');
const { config } = require('./config');
const mailService = require('./services/mailService');
const notificationHelper = require('./services/notificationHelper');
const fcmHelper = require('./services/fcmHelper');
const checkForNotFilledQuestionnaires = require('./cronjobs/questionnaireCronjobs');

let server;
let instanceNotificationCreationJob;
let notificationSendingJob;
let dailySampleReportMailsJob;
let checkForNotFilledQuestionnairesJobs;
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

  // Start scheduled jobs
  mailService.initService();

  listeningDbClient = new ListeningDbClient(db);
  listeningDbClient.on('connected', (client) =>
    registerDbNotifications(client)
  );
  listeningDbClient.connect();

  // Starting cronJobs once the database service connection is made
  checkForNotFilledQuestionnairesJobs = checkForNotFilledQuestionnaires.start();
  fcmHelper.initFBAdmin();
  instanceNotificationCreationJob =
    notificationHelper.scheduleInstanceNotificationCreation();
  notificationSendingJob = notificationHelper.scheduleNotificationSending();
  dailySampleReportMailsJob =
    notificationHelper.scheduleDailySampleReportMails();
};

exports.stop = async () => {
  checkForNotFilledQuestionnairesJobs.cancel();

  instanceNotificationCreationJob.cancel();
  notificationSendingJob.cancel();
  dailySampleReportMailsJob.cancel();

  await listeningDbClient.disconnect();
  await server.stop();
  server.log(['startup'], `Server was stopped`);
};

// This Export is needed in the integration tests
exports.checkForNotFilledQuestionnairesJobs = () => {
  return checkForNotFilledQuestionnairesJobs;
};

exports.terminate = async () => {
  db.$pool.end();
};

async function registerDbNotifications(dbClient) {
  dbClient.on('notification', async function (msg) {
    if (msg.name === 'notification') {
      try {
        const pl = JSON.parse(msg.payload);
        if (msg.channel === 'table_update' && pl.table === 'lab_results') {
          console.log('got table update for lab_results');
          await notificationHelper.handleUpdatedLabResult(
            pl.row_old,
            pl.row_new
          );
        } else if (msg.channel === 'table_update' && pl.table === 'users') {
          console.log('got table update for users');
          await notificationHelper.handleUpdatedUser(pl.row_old, pl.row_new);
        } else if (
          msg.channel === 'table_update' &&
          pl.table === 'questionnaire_instances'
        ) {
          console.log('got table update for questionnaire_instances');
          if (pl.row_new.status === 'released_once') {
            await notificationHelper.questionnaireInstanceHasNotableAnswers(
              pl.row_new.id
            );
          }
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
      } catch (e) {
        console.error(e);
      }
    }
  });
  await dbClient.query('LISTEN table_update');
  await dbClient.query('LISTEN table_insert');
  console.log('now listening to DB notifications');
}
