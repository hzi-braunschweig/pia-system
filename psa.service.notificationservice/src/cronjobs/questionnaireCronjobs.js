const postgresqlHelper = require('../services/postgresqlHelper.js');
const notificationHelper = require('../services/notificationHelper.js');
const { config } = require('../config');
const CronJob = require('cron').CronJob;

const start = function () {
  // Check for questionnaires that are due to be filled out
  const dueQuestionnairesJob = new CronJob(
    '*/10 * * * *',
    async () => {
      const ids =
        await postgresqlHelper.getNotFilledoutQuestionnaireInstanceIds();
      for (let i = 0; i < ids.length; i++) {
        // 'await' used to prevent insert duplications
        await postgresqlHelper.insertContactProbandRecordForNotAnswered({
          questionnaireInstanceId: ids[i],
        });
      }
    },
    null,
    true,
    'Europe/Berlin'
  );
  dueQuestionnairesJob.start();

  // Run the questionnaires status aggregator email
  const questionnaireStatusAggregatorJob = new CronJob(
    '0 7 * * *',
    async function () {
      const aggregatorEmailStats =
        await postgresqlHelper.getDailyAggregatorEmailStats();
      for (const [, value] of aggregatorEmailStats) {
        if (
          value.email &&
          (value.notFinishedQuestionnairesNum > 0 ||
            value.questionnairesWithNotableAnswersNum > 0)
        ) {
          const notificationTitle = 'PIA - Auffällige und fehlende Eingaben';
          let notificationBody = 'Liebes Koordinationsteam,\n\n';
          if (value.questionnairesWithNotableAnswersNum > 0) {
            notificationBody +=
              value.questionnairesWithNotableAnswersNum +
              ' Personen haben auffällige Symptome gemeldet.\n';
          }
          if (value.notFinishedQuestionnairesNum > 0) {
            notificationBody +=
              value.notFinishedQuestionnairesNum +
              ' Personen haben nichts gemeldet.\n';
          }
          notificationBody +=
            '\nÖffnen Sie PIA über ' +
            config.webappUrl +
            ' und melden sich an. Unter „Zu kontaktieren“ können Sie sich Teilnehmende anzeigen lassen, die auffällige Symptome oder nichts gemeldet haben.\n\n' +
            'Bitte treten Sie mit den entsprechenden Personen in Kontakt.';
          await notificationHelper.createNotableAnswerNotification(
            value.email,
            new Date(),
            notificationTitle,
            notificationBody
          );
        }
      }
    },
    null,
    true,
    'Europe/Berlin'
  );
  questionnaireStatusAggregatorJob.start();
  console.log('Questionnaire cron jobs started');
  return {
    dueQuestionnairesJob,
    questionnaireStatusAggregatorJob,
    cancel: () => {
      dueQuestionnairesJob.stop();
      questionnaireStatusAggregatorJob.stop();
    },
  };
};

module.exports = { start: start };
