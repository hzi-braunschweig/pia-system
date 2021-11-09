/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Hapi from '@hapi/hapi';
import { IClient } from 'pg-promise/typescript/pg-subset';
import {
  DatabaseNotification,
  ListeningDbClient,
  MailService,
  ParsedDatabasePayload,
  registerAuthStrategies,
  registerPlugins,
} from '@pia/lib-service-core';

import * as packageJson from '../package.json';
import { db } from './db';
import { config } from './config';
import { NotificationHelper } from './services/notificationHelper';
import { FcmHelper } from './services/fcmHelper';
import { QuestionnaireCronjobs } from './cronjobs/questionnaireCronjobs';
import { LabResult } from './models/labResult';
import { DbQuestionnaireInstance } from './models/questionnaireInstance';
import { messageQueueService } from './services/messageQueueService';

interface Cancelable {
  cancel: () => void;
}

export class Server {
  // This Export is needed in the integration tests
  public static checkForNotFilledQuestionnairesJobs: Cancelable;

  private static server: Hapi.Server;
  private static instanceNotificationCreationJob: Cancelable;
  private static notificationSendingJob: Cancelable;
  private static dailySampleReportMailsJob: Cancelable;
  private static listeningDbClient: ListeningDbClient<unknown>;

  public static async init(): Promise<void> {
    this.server = Hapi.server({
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

    await registerAuthStrategies(this.server, {
      strategies: ['jwt'],
      publicAuthKey: config.publicAuthKey,
      db: db,
    });
    await registerPlugins(this.server, {
      name: packageJson.name,
      version: packageJson.version,
      routes: './src/routes/*.js',
    });

    await this.server.start();
    this.server.log(['startup'], `Server running at ${this.server.info.uri}`);

    // Start scheduled jobs
    MailService.initService(config.servers.mailserver);

    this.listeningDbClient = new ListeningDbClient(db);
    this.listeningDbClient.on(
      'connected',
      (client) => void Server.registerDbNotifications(client)
    );
    await this.listeningDbClient.connect();
    await messageQueueService.connect();
    // Starting cronJobs once the database service connection is made
    this.checkForNotFilledQuestionnairesJobs = QuestionnaireCronjobs.start();
    FcmHelper.initFBAdmin();
    this.instanceNotificationCreationJob =
      NotificationHelper.scheduleInstanceNotificationCreation();
    this.notificationSendingJob =
      NotificationHelper.scheduleNotificationSending();
    this.dailySampleReportMailsJob =
      NotificationHelper.scheduleDailySampleReportMails();
  }

  public static async stop(): Promise<void> {
    this.checkForNotFilledQuestionnairesJobs.cancel();

    this.instanceNotificationCreationJob.cancel();
    this.notificationSendingJob.cancel();
    this.dailySampleReportMailsJob.cancel();

    await messageQueueService.disconnect();
    await this.listeningDbClient.disconnect();
    await this.server.stop();
    this.server.log(['startup'], `Server was stopped`);
  }

  public static async terminate(): Promise<void> {
    await db.$pool.end();
  }

  public static async registerDbNotifications(
    dbClient: IClient
  ): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    dbClient.on('notification', async (msg: DatabaseNotification) => {
      if (msg.name === 'notification') {
        try {
          const pl: ParsedDatabasePayload = JSON.parse(
            msg.payload
          ) as ParsedDatabasePayload;
          if (msg.channel === 'table_update' && pl.table === 'lab_results') {
            console.log('got table update for lab_results');
            await NotificationHelper.handleUpdatedLabResult(
              pl.row_old as LabResult,
              pl.row_new as LabResult
            );
          } else if (
            msg.channel === 'table_update' &&
            pl.table === 'questionnaire_instances'
          ) {
            console.log('got table update for questionnaire_instances');
            if (
              (pl.row_new as DbQuestionnaireInstance).status === 'released_once'
            ) {
              await NotificationHelper.questionnaireInstanceHasNotableAnswers(
                (pl.row_new as DbQuestionnaireInstance).id
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
}
