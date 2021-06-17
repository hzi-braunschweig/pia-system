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
let checkForNotFilledQuestionnairesJob;
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
  checkForNotFilledQuestionnairesJob = checkForNotFilledQuestionnaires.start();
  fcmHelper.initFBAdmin();
  instanceNotificationCreationJob =
    notificationHelper.scheduleInstanceNotificationCreation();
  notificationSendingJob = notificationHelper.scheduleNotificationSending();
  dailySampleReportMailsJob =
    notificationHelper.scheduleDailySampleReportMails();
};

exports.stop = async () => {
  checkForNotFilledQuestionnairesJob.cancel();

  instanceNotificationCreationJob.cancel();
  notificationSendingJob.cancel();
  dailySampleReportMailsJob.cancel();

  await listeningDbClient.disconnect();
  await server.stop();
  server.log(['startup'], `Server was stopped`);
};

exports.terminate = async () => {
  db.$pool.end();
};

async function registerDbNotifications(dbClient) {
  dbClient.on('notification', function (msg) {
    if (msg.name === 'notification') {
      const pl = JSON.parse(msg.payload);
      if (msg.channel === 'table_update' && pl.table === 'lab_results') {
        console.log('got table update for lab_results');
        notificationHelper
          .handleUpdatedLabResult(pl.row_old, pl.row_new)
          .catch(function (err) {
            console.log(err);
          });
      } else if (msg.channel === 'table_update' && pl.table === 'users') {
        console.log('got table update for users');
        notificationHelper
          .handleUpdatedUser(pl.row_old, pl.row_new)
          .catch(function (err) {
            console.log(err);
          });
      } else if (
        msg.channel === 'table_update' &&
        pl.table === 'questionnaire_instances'
      ) {
        console.log('got table update for questionnaire_instances');
        if (pl.row_new.status === 'released_once') {
          notificationHelper
            .questionnaireInstanceHasNotableAnswers(pl.row_new.id)
            .catch(function (err) {
              console.log(err);
            });
        }
      }
    }
  });
  await dbClient.query('LISTEN table_update');
  await dbClient.query('LISTEN table_insert');
  console.log('now listening to DB notifications');
}