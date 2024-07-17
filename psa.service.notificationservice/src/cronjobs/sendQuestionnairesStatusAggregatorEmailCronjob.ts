/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Cronjob from './cronjob';
import { CronJob } from 'cron';
import { Cancelable } from '../models/cancelable';
import * as postgresqlHelper from '../services/postgresqlHelper';
import { config } from '../config';
import NotificationHelper from '../services/notificationHelper';

// Run the questionnaires status aggregator email
export default class SendQuestionnairesStatusAggregatorEmailCronjob
  implements Cronjob
{
  public start(): Cancelable {
    const cronjob = new CronJob(
      '0 7 * * *',
      () => void this.execute(),
      null,
      true,
      'Europe/Berlin'
    );

    cronjob.start();

    console.log('Questionnaire status aggregator email cronjob started');

    return {
      cancel: (): void => {
        cronjob.stop();
      },
    };
  }

  public async execute(): Promise<void> {
    const aggregatorEmailStats = await this.getDailyAggregatorEmailStats();

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
  }

  private async getDailyAggregatorEmailStats(): Promise<
    Map<
      string,
      {
        email: string;
        notFinishedQuestionnairesNum: number;
        questionnairesWithNotableAnswersNum: number;
      }
    >
  > {
    return await postgresqlHelper.getDailyAggregatorEmailStats();
  }
}
