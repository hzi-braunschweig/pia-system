/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as schedule from 'node-schedule';
import * as postgresqlHelper from '../services/postgresqlHelper';
import { DbQuestionnaireInstance } from '../models/questionnaireInstance';
import { DbQuestionnaire } from '../models/questionnaire';
import { config } from '../config';
import NotificationHelper from '../services/notificationHelper';
import { zonedTimeToUtc } from 'date-fns-tz';
import Cronjob from './cronjob';

/**
 * Check which notifications are to be send and schedules them
 */
export default class ScheduleInstanceNotificationsCronjob implements Cronjob {
  public start(): schedule.Job {
    // Once every hour at the tenth minute
    const rule = new schedule.RecurrenceRule();
    rule.minute = 10;

    return schedule.scheduleJob(rule, () => {
      void this.execute();
    });
  }

  public async execute(): Promise<void> {
    console.log('Starting check and schedule for questionnaire instances');
    const qInstancesResult =
      (await postgresqlHelper.getActiveQuestionnaireInstances()) as DbQuestionnaireInstance[];
    console.log(`Found potential qIs: ${qInstancesResult.length}`);

    for (const qInstance of qInstancesResult) {
      const pseudonym = qInstance.user_id;
      const questionnaireSettings =
        (await postgresqlHelper.getQuestionnaireNotificationSettings(
          qInstance.questionnaire_id,
          qInstance.questionnaire_version
        )) as DbQuestionnaire;

      if (questionnaireSettings.cycle_unit !== 'spontan') {
        const zonedSendDates =
          NotificationHelper.createDatesForUserNotification(
            questionnaireSettings,
            qInstance.date_of_issue
          );
        const sendDates = zonedSendDates.map((date) => {
          return zonedTimeToUtc(date, config.timeZone);
        });

        await postgresqlHelper.markInstanceAsScheduled(qInstance.id);
        for (const date of sendDates) {
          try {
            await NotificationHelper.createNotification(
              date,
              pseudonym,
              'qReminder',
              qInstance.id.toString()
            );
          } catch (error) {
            console.error('failed to create notification', error);
          }
        }
      }
    }
  }
}
