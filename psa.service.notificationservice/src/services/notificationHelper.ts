/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as schedule from 'node-schedule';

import {
  addDays,
  addHours,
  format,
  set,
  startOfToday,
  subDays,
} from 'date-fns';

import * as postgresqlHelper from './postgresqlHelper';
import { FcmHelper } from './fcmHelper';
import { MailService } from '@pia/lib-service-core';
import { config } from '../config';
import { personaldataserviceClient } from '../clients/personaldataserviceClient';
import { questionnaireserviceClient } from '../clients/questionnaireserviceClient';
import { assert } from 'ts-essentials';
import { User } from '../models/user';
import { LabResult } from '../models/labResult';
import { DbNotificationSchedules } from '../models/notification';
import { DbAnswer } from '../models/answer';
import { DbQuestionnaire } from '../models/questionnaire';
import { FcmToken } from '../models/fcmToken';
import StatusCodes from 'http-status-codes';
import { Boom } from '@hapi/boom';
import { DbQuestionnaireInstance } from '../models/questionnaireInstance';
import { zonedTimeToUtc } from 'date-fns-tz';
import { userserviceClient } from '../clients/userserviceClient';

interface Study {
  name: string;
  pm_email: string;
  hub_email: string;
}

interface Schedule {
  user_id: string;
  reference_id: string;
  id: number;
  title: string;
  body: string;
  send_on: Date;
  notification_type: string;
}

/**
 * helper methods to send notifications
 */

export class NotificationHelper {
  /**
   * schedules the hourly notification creation
   */
  public static scheduleInstanceNotificationCreation(): schedule.Job {
    // Once every hour at the fifth minute
    const rule = new schedule.RecurrenceRule();
    rule.minute = 10;

    return schedule.scheduleJob(rule, () => {
      void NotificationHelper.checkAndScheduleNotifications();
    });
  }

  /**
   * schedules the sending of notifications every 10 minutes
   */
  public static scheduleNotificationSending(): schedule.Job {
    // Every 10 minutes
    const start = 0;
    const end = 59;
    const step = 10;
    const rule = new schedule.RecurrenceRule();
    rule.minute = new schedule.Range(start, end, step);

    return schedule.scheduleJob(rule, () => {
      void NotificationHelper.sendAllOpenNotifications();
    });
  }

  /**
   * schedules the daily sample report
   */
  public static scheduleDailySampleReportMails(): schedule.Job {
    // Once a day at 4 am
    const rule = new schedule.RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;

    return schedule.scheduleJob(rule, () => {
      void NotificationHelper.sendSampleReportMails();
    });
  }

  /**
   * sends a mail to PM about new samples
   */
  public static async sendSampleReportMails(): Promise<void> {
    const studiesPM = await postgresqlHelper.getStudiesWithPMEmail();
    const studiesHUB = await postgresqlHelper.getStudiesWithHUBEmail();

    await Promise.all(
      studiesPM.map(async (study: Study) => {
        await NotificationHelper.sendSampleReportToPM(study);
      })
    );

    await Promise.all(
      studiesHUB.map(async (study: Study) => {
        await NotificationHelper.sendSampleReportToHUB(study);
      })
    );
  }

  public static async sendSampleReportToPM(study: Study): Promise<void> {
    const probandsOfStudy = await userserviceClient.getPseudonyms({
      study: study.name,
    });
    const labResults = await postgresqlHelper.getNewSampledSamplesForProbands(
      probandsOfStudy
    );
    if (labResults.length > 0) {
      console.log(
        `Found ${labResults.length} sampled labresults from yesterday in study ${study.name}, which the PM will be informed about`
      );
      const sampleReportMail = {
        subject: 'PIA – neue Proben sind auf dem Weg ins Labor!',
        text: `Gestern wurden ${labResults.length} Proben in ${study.name} erhoben. Sie sind auf dem Weg ins Labor und kommen bald an!`,
        html: `Gestern wurden <br><h3>${labResults.length}</h3><br> Proben in ${study.name} erhoben. Sie sind auf dem Weg ins Labor und kommen bald an!`,
      };
      await MailService.sendMail(study.pm_email, sampleReportMail);
    }
  }

  public static async sendSampleReportToHUB(study: Study): Promise<void> {
    const probandsOfStudy = await userserviceClient.getPseudonyms({
      study: study.name,
    });
    const labResults = (await postgresqlHelper.getNewAnalyzedSamplesForProbands(
      probandsOfStudy
    )) as LabResult[];
    if (labResults.length > 0) {
      console.log(
        `Found ${labResults.length} analyzed labresults from yesterday in study ${study.name}, which the hub will be informed about`
      );
      const analyzedDate = format(subDays(startOfToday(), 1), 'dd.MM.yy');
      const participantCount = new Set(
        labResults.map((result) => {
          return result.user_id;
        })
      ).size;
      let mailText = `Datum der Analyse an der MHH: ${analyzedDate}\nAnzahl der Teilnehmenden: ${participantCount}\nProben:\n`;
      let mailHtml = `Datum der Analyse an der MHH: ${analyzedDate}<br>Anzahl der Teilnehmenden: ${participantCount}<br>Proben:<br>`;
      labResults.forEach((result) => {
        mailText += `${result.id}, `;
        mailHtml += `${result.id}, `;
        if (result.dummy_sample_id) {
          mailText += result.dummy_sample_id + ', ';
          mailHtml += result.dummy_sample_id + ', ';
        }
      });
      const sampleReportMail = {
        subject: 'ZIFCO',
        text: mailText,
        html: mailHtml,
      };
      await MailService.sendMail(study.hub_email, sampleReportMail);
    } else {
      console.log(
        'Found no new labresults in study: ' +
          study.name +
          ', sending no email to hub'
      );
    }
  }

  /**
   * checks which notifications are to be send and schedules them
   */
  public static async checkAndScheduleNotifications(): Promise<void> {
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

  /**
   * creates dates for push notifications
   * @param userSettings the user settings
   * @param questionnaireSettings the questionnaire settings
   * @param dateOfIssue
   */
  public static createDatesForUserNotification(
    questionnaireSettings: DbQuestionnaire,
    dateOfIssue: Date
  ): Date[] {
    const sendDates = [];

    const notification_interval_unit =
      questionnaireSettings.notification_interval_unit
        ? questionnaireSettings.notification_interval_unit
        : 'days';
    const notification_interval = questionnaireSettings.notification_interval
      ? questionnaireSettings.notification_interval
      : 1;

    for (let i = 0; i < questionnaireSettings.notification_tries; i++) {
      const notificationTime = set(new Date(), config.notificationTime);
      let newDate = null;

      // Use instance date as reference
      if (questionnaireSettings.cycle_unit === 'hour') {
        newDate =
          notification_interval_unit === 'days'
            ? addDays(new Date(dateOfIssue), i * notification_interval)
            : addHours(new Date(dateOfIssue), i * notification_interval);
      }
      // Use notification time as reference
      else if (notification_interval_unit === 'days') {
        newDate = addDays(notificationTime, i * notification_interval);
      } else if (notification_interval_unit === 'hours') {
        newDate = addHours(notificationTime, i * notification_interval);
      }

      if (newDate) sendDates.push(newDate);
    }

    return sendDates;
  }

  public static async createNotification(
    date: Date,
    user_id: string,
    type: string,
    reference_id: string
  ): Promise<void> {
    const notificationSchedule = [user_id, date, type, reference_id];
    await postgresqlHelper.insertNotificationSchedule(notificationSchedule);
  }

  /**
   * creates a custom a schedule for a custom notification
   */

  public static async createCustomNotification(
    date: Date | null,
    user_id: string,
    reference_id: string,
    title: string,
    body: string
  ): Promise<DbNotificationSchedules> {
    const notificationSchedule = [
      user_id,
      date,
      'custom',
      reference_id,
      title,
      body,
    ];
    return (await postgresqlHelper.insertCustomNotificationSchedule(
      notificationSchedule
    )) as DbNotificationSchedules;
  }

  /**
   * creates a custom a schedule for a notable answer notification
   */
  public static async createNotableAnswerNotification(
    email: string,
    date: Date,
    title: string,
    body: string
  ): Promise<void> {
    const notificationSchedule = [
      null,
      date,
      'questionnaires_stats_aggregator',
      email,
      title,
      body,
    ];
    await postgresqlHelper.insertCustomNotificationSchedule(
      notificationSchedule
    );
  }

  /**
   * handles updates to a lab result
   * @param {object} r_old the old lab_result
   * @param {object} r_new the new lab_result
   */
  public static async handleUpdatedLabResult(
    r_old: LabResult,
    r_new: LabResult
  ): Promise<void> {
    if (r_old.status !== 'analyzed' && r_new.status === 'analyzed') {
      const userComplicanceLabresults =
        (await postgresqlHelper.getUserComplianceLabresults(
          r_new.user_id
        )) as User;
      if (userComplicanceLabresults.compliance_labresults) {
        const zonedSendDate = set(new Date(), config.notificationTime);
        const sendDate = zonedTimeToUtc(zonedSendDate, config.timeZone);
        console.log(
          `New labresult was analysed, scheduling notification to: ${
            r_new.user_id
          } at: ${sendDate.toString()}`
        );
        await NotificationHelper.createNotification(
          sendDate,
          r_new.user_id,
          'sample',
          r_new.id
        );
      }
    }
  }

  /**
   * handles updates to a questionnaire instance answer
   * @param {integer} questionnaireInstanceId the questionnaire instance id
   */
  public static async questionnaireInstanceHasNotableAnswers(
    questionnaireInstanceId: number
  ): Promise<void> {
    const hasAnswersNotifyFeature =
      await postgresqlHelper.hasAnswersNotifyFeature(questionnaireInstanceId);
    if (hasAnswersNotifyFeature) {
      const answers = (await postgresqlHelper.getQuestionnaireInstanceAnswers(
        questionnaireInstanceId
      )) as DbAnswer[];
      for (const answer of answers) {
        const isNotableAnswer = (await postgresqlHelper.isNotableAnswer(
          answer.answer_option_id,
          answer.value
        )) as boolean;
        if (isNotableAnswer) {
          await postgresqlHelper.insertContactProbandRecordForNotableAnswer(
            questionnaireInstanceId
          );
          break;
        }
      }
    }
  }

  /**
   * sends all due notifications
   */
  public static async sendAllOpenNotifications(): Promise<void> {
    const scheduledNotifications =
      (await postgresqlHelper.getAllDueNotifications()) as Schedule[];
    console.log(
      `Found ${scheduledNotifications.length} scheduled notifications`
    );
    await Promise.all(
      scheduledNotifications.map(async (notificationSchedule) => {
        if (notificationSchedule.notification_type === 'qReminder') {
          try {
            await NotificationHelper.sendInstanceNotification(
              notificationSchedule
            );
          } catch (e) {
            console.log(e);
          }
        } else if (notificationSchedule.notification_type === 'sample') {
          try {
            await NotificationHelper.sendSampleNotification(
              notificationSchedule
            );
          } catch (e) {
            console.log(e);
          }
        } else if (notificationSchedule.notification_type === 'custom') {
          try {
            await NotificationHelper.processScheduledCustomNotification(
              notificationSchedule
            );
          } catch (e) {
            console.log(e);
          }
        } else if (
          notificationSchedule.notification_type ===
          'questionnaires_stats_aggregator'
        ) {
          try {
            await NotificationHelper.sendQuestionnairesStatsAggregatorNotification(
              notificationSchedule
            );
          } catch (e) {
            console.log(e);
          }
        }
      })
    );
  }

  public static async sendInstanceNotification(
    notificationSchedule: Schedule
  ): Promise<void> {
    try {
      const qInstance = await questionnaireserviceClient
        .getQuestionnaireInstance(
          Number.parseInt(notificationSchedule.reference_id),
          true
        )
        .catch((err) => {
          if (
            err instanceof Boom &&
            err.output.statusCode === StatusCodes.NOT_FOUND
          ) {
            return null;
          } else throw err;
        });

      if (!qInstance) {
        console.log(
          `The questionnaire instance of that notification schedule is no longer present, deleting schedule for instance: ${notificationSchedule.reference_id}`
        );
        await postgresqlHelper.deleteScheduledNotificationByInstanceId(
          notificationSchedule.reference_id
        );
      } else if (qInstance.questionnaire.questions.length === 0) {
        console.log(
          `The questionnaire of that notification schedule is empty because of conditions, postponing schedule for instance: ${notificationSchedule.reference_id}`
        );
        await postgresqlHelper.postponeNotificationByInstanceId(
          notificationSchedule.reference_id
        );
      } else if (
        qInstance.status === 'active' ||
        qInstance.status === 'in_progress'
      ) {
        assert(qInstance.pseudonym === notificationSchedule.user_id);

        const tokens = (await postgresqlHelper.getToken(
          notificationSchedule.user_id
        )) as FcmToken[];
        const sendNotification = tokens.length > 0;
        const sendMail = !sendNotification;

        let notification_body;
        const notification_title = qInstance.questionnaire.notificationTitle;

        if (qInstance.status === 'active') {
          notification_body = qInstance.questionnaire.notificationBodyNew;
        } else {
          notification_body =
            qInstance.questionnaire.notificationBodyInProgress;
        }

        let didSendReminder = false;
        try {
          if (sendNotification) {
            let numberOfOpenQuestionnairesForBadge: number | undefined;
            try {
              numberOfOpenQuestionnairesForBadge =
                (await postgresqlHelper.countOpenQuestionnaireInstances(
                  notificationSchedule.user_id
                )) as number;
            } catch (e) {
              console.log('Could not fetch QI count', e);
            }

            const success = await NotificationHelper.sendNotifications({
              recipient: qInstance.pseudonym,
              tokens,
              notificationId: notificationSchedule.id,
              badgeNumber: numberOfOpenQuestionnairesForBadge,
              updateTimeForNotification: true,
              type: `instance id (${qInstance.id})`,
            });
            if (success) {
              didSendReminder = true;
            }
          }
          if (sendMail) {
            console.log(
              `Sending email to user: ${qInstance.pseudonym} for instance id: ${qInstance.id}`
            );

            const email = await personaldataserviceClient
              .getPersonalDataEmail(qInstance.pseudonym)
              .catch(() => {
                console.log('User has no email address');
                return null;
              });

            if (email) {
              const url = `${config.webappUrl}/extlink/questionnaire/${qInstance.questionnaire.id}/${qInstance.id}`;
              const InstanceReminderMail = {
                subject: notification_title,
                text: `Liebe:r Nutzer:in,\n\n${notification_body}\nKlicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:\n<a href="${url}">PIA Webapp</a>`,
                html: `Liebe:r Nutzer:in,<br><br>${notification_body}<br>Klicken Sie auf folgenden Link, um direkt zum Fragebogen zu gelangen:<br><a href="${url}">PIA Webapp</a>`,
              };
              await MailService.sendMail(email, InstanceReminderMail);
              console.log(
                `Successfully sent email to user: ${qInstance.pseudonym} for instance id: ${qInstance.id}`
              );
              await postgresqlHelper.deleteScheduledNotification(
                notificationSchedule.id
              );
              didSendReminder = true;
            }
          }
        } catch (e) {
          console.log(e);
        }

        if (!didSendReminder) {
          console.log(
            `Error sending notification AND email to user: ${qInstance.pseudonym} for instance id: ${qInstance.id}, postponing it`
          );
          await postgresqlHelper.postponeNotificationByInstanceId(
            notificationSchedule.reference_id
          );
        }
      } else if (
        qInstance.status === 'released_once' ||
        qInstance.status === 'released_twice' ||
        qInstance.status === 'expired'
      ) {
        console.log(
          `The questionnaire instance of that notification schedule hase been released or is expired, deleting schedule for instance: ${notificationSchedule.reference_id}`
        );
        await postgresqlHelper.deleteScheduledNotificationByInstanceId(
          notificationSchedule.reference_id
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  public static async sendSampleNotification(
    notificationSchedule: Schedule
  ): Promise<void> {
    const labResult = (await postgresqlHelper.getLabResult(
      notificationSchedule.reference_id
    )) as LabResult;
    const tokens = (await postgresqlHelper.getToken(
      notificationSchedule.user_id
    )) as FcmToken[];

    const sendNotification = tokens.length > 0;
    const sendMail = !sendNotification;

    let didSendReminder = false;
    try {
      if (sendNotification) {
        const success = await NotificationHelper.sendNotifications({
          recipient: notificationSchedule.user_id,
          tokens,
          notificationId: notificationSchedule.id,
          updateTimeForNotification: true,
          type: `sample id (${labResult.id})`,
        });
        if (success) {
          didSendReminder = true;
        }
      }
      if (sendMail) {
        console.log(
          'Sending labresult email for: ' +
            notificationSchedule.reference_id +
            ' to: ' +
            notificationSchedule.user_id
        );

        const email = await personaldataserviceClient
          .getPersonalDataEmail(notificationSchedule.user_id)
          .catch(() => {
            console.log('User has no email address');
            return null;
          });

        if (email) {
          const InstanceReminderMail = {
            subject: 'PIA: Neuer Laborbericht!',
            text:
              'Liebe:r Nutzer:in,\n\n' +
              'eine Ihrer Proben wurde analysiert. Klicken Sie auf folgenden Link, um direkt zum Laborbericht zu gelangen:\n' +
              '<a href="' +
              config.webappUrl +
              '/laboratory-results/' +
              labResult.id +
              '">PIA Webapp</a>',
            html:
              'Liebe:r Nutzer:in,<br><br>' +
              'eine Ihrer Proben wurde analysiert. Klicken Sie auf folgenden Link, um direkt zum Laborbericht zu gelangen:<br>' +
              '<a href="' +
              config.webappUrl +
              '/laboratory-results/' +
              labResult.id +
              '">PIA Webapp</a>',
          };
          await MailService.sendMail(email, InstanceReminderMail);
          console.log(
            'Successfully sent email to user: ' +
              notificationSchedule.user_id +
              ' for sample id: ' +
              notificationSchedule.reference_id
          );
          await postgresqlHelper.deleteScheduledNotification(
            notificationSchedule.id
          );
          didSendReminder = true;
        }
      }
    } catch (e) {
      console.log(e);
    }
    if (!didSendReminder) {
      console.log(
        'Error sending notification AND email to user: ' +
          notificationSchedule.user_id +
          ' for sample id: ' +
          notificationSchedule.reference_id,
        ', postponing it'
      );
      await postgresqlHelper.postponeNotification(notificationSchedule.id);
    }
  }

  public static async sendQuestionnairesStatsAggregatorNotification(
    notificationSchedule: Schedule
  ): Promise<void> {
    console.log(
      `Sending questionnaires_stats_aggregator notification with id ${notificationSchedule.id}`
    );
    try {
      const emailTo = notificationSchedule.reference_id;
      if (emailTo) {
        const emailPayload = {
          subject: notificationSchedule.title,
          text: notificationSchedule.body,
          html: notificationSchedule.body.replace(/\r\n|\r|\n/g, '<br>'),
        };
        await MailService.sendMail(emailTo, emailPayload);
        console.log('Successfully sent email to: ' + emailTo);
        await postgresqlHelper.deleteScheduledNotification(
          notificationSchedule.id
        );
      } else {
        console.log('user has no email address');
      }
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * Processes a scheduled notification
   */
  public static async processScheduledCustomNotification(
    notificationSchedule: Schedule
  ): Promise<void> {
    const tokens = (await postgresqlHelper.getToken(
      notificationSchedule.user_id
    )) as FcmToken[];

    await NotificationHelper.sendNotifications({
      recipient: notificationSchedule.user_id,
      tokens,
      notificationId: notificationSchedule.id,
      postponeOnException: true,
      updateTimeForNotification: true,
      type: 'scheduled custom',
    });
  }

  public static async sendNotifications({
    tokens,
    recipient,
    notificationId,
    postponeOnException,
    badgeNumber,
    updateTimeForNotification,
    type,
  }: {
    recipient: string;
    tokens: FcmToken[];
    notificationId: number;
    postponeOnException?: boolean;
    badgeNumber?: number;
    updateTimeForNotification?: boolean;
    type: string;
  }): Promise<boolean> {
    console.log(
      `Sending ${type} notification to: ${recipient} (${tokens.length} token)`
    );

    let successfull = 0;
    for (const token of tokens) {
      try {
        if (
          await NotificationHelper.sendNotification({
            recipient,
            token,
            notificationId,
            postponeOnException,
            badgeNumber,
            type,
          })
        ) {
          successfull++;
        }
      } catch (e) {
        console.log(e);
      }
    }

    if (successfull > 0) {
      console.log(
        `Successfully sent ${type} notification to: ${recipient} (${successfull}/${tokens.length} token notified successfull)`
      );
      if (updateTimeForNotification) {
        await postgresqlHelper.updateTimeForNotification(notificationId, null);
      }
    } else {
      console.log(
        `Failed to sent ${type} notification to: ${recipient} (none of ${tokens.length} token notified successfull)`
      );
    }
    return successfull > 0;
  }

  public static async sendNotification({
    token,
    notificationId,
    badgeNumber,
    postponeOnException,
    recipient,
    type,
  }: {
    recipient: string;
    token: FcmToken;
    notificationId: number;
    postponeOnException?: boolean;
    badgeNumber?: number;
    type: string;
  }): Promise<boolean> {
    const notifiactionResult = await FcmHelper.sendDefaultNotification(
      token.token,
      notificationId,
      badgeNumber
    );
    if (notifiactionResult.exception) {
      if (postponeOnException) {
        console.log(
          `Could not send ${type} notification to: ${recipient}, postponing it`
        );
        console.log(notifiactionResult.exception);
        await postgresqlHelper.postponeNotificationByOneHour(notificationId);
      } else {
        console.log(`Could not send ${type} notification to: ${recipient}`);
        console.log(notifiactionResult.exception);
      }
      return false;
    }

    if (notifiactionResult.error) {
      console.log(
        `Could not send ${type} notification to: ${recipient} got rejected - deleting token`
      );
      console.log(notifiactionResult.error);
      await postgresqlHelper.removeFCMToken(token.token);
      return false;
    }

    return true;
  }
}

export default NotificationHelper;
