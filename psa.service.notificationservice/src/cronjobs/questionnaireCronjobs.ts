/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as postgresqlHelper from '../services/postgresqlHelper';
import { NotificationHelper } from '../services/notificationHelper';
import { config } from '../config';
import { CronJob } from 'cron';

export class QuestionnaireCronjobs {
  public static start(): {
    dueQuestionnairesJob: CronJob;
    questionnaireStatusAggregatorJob: CronJob;
    cancel: () => void;
  } {
    // Check for questionnaires that are due to be filled out
    const dueQuestionnairesJob = new CronJob(
      '*/10 * * * *',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async () => {
        const ids =
          (await postgresqlHelper.getNotFilledoutQuestionnaireInstanceIds()) as number[];
        for (const id of ids) {
          // 'await' used to prevent insert duplications
          await postgresqlHelper.insertContactProbandRecordForNotAnswered({
            questionnaireInstanceId: id,
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
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async function () {
        const aggregatorEmailStats =
          (await postgresqlHelper.getDailyAggregatorEmailStats()) as Map<
            string,
            {
              email: string;
              notFinishedQuestionnairesNum: number;
              questionnairesWithNotableAnswersNum: number;
            }
          >;
        for (const [, value] of aggregatorEmailStats) {
          if (
            value.email &&
            (value.notFinishedQuestionnairesNum > 0 ||
              value.questionnairesWithNotableAnswersNum > 0)
          ) {
            const notificationTitle = 'PIA - Auffällige und fehlende Eingaben';
            let notificationBody = 'Liebes Koordinationsteam,\n\n';
            if (value.questionnairesWithNotableAnswersNum > 0) {
              notificationBody += `${value.questionnairesWithNotableAnswersNum} Personen haben auffällige Symptome gemeldet.\n`;
            }
            if (value.notFinishedQuestionnairesNum > 0) {
              notificationBody += `${value.notFinishedQuestionnairesNum} Personen haben nichts gemeldet.\n`;
            }
            notificationBody +=
              '\nÖffnen Sie PIA über ' +
              config.adminAppUrl +
              ' und melden sich an. Unter „Zu kontaktieren“ können Sie sich Teilnehmende anzeigen lassen, die auffällige Symptome oder nichts gemeldet haben.\n\n' +
              'Bitte treten Sie mit den entsprechenden Personen in Kontakt.';
            await NotificationHelper.createNotableAnswerNotification(
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
      cancel: (): void => {
        dueQuestionnairesJob.stop();
        questionnaireStatusAggregatorJob.stop();
      },
    };
  }
}
