/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { performance } from 'perf_hooks';
import * as Hapi from '@hapi/hapi';
import { IClient } from 'pg-promise/typescript/pg-subset';
import {
  DatabaseNotification,
  isoDateStringReviverFn,
  ListeningDbClient,
  ParsedDatabasePayload,
  registerPlugins,
} from '@pia/lib-service-core';

import * as packageJson from '../package.json';
import { config } from './config';
import { db } from './db';
import { TaskScheduler } from './services/taskScheduler';
import { NotificationHandlers } from './services/notificationHandlers';
import { Questionnaire } from './models/questionnaire';
import { QuestionnaireInstance } from './models/questionnaireInstance';
import { messageQueueService } from './services/messageQueueService';

export class Server {
  private static instance: Hapi.Server;

  private static listeningDbClient: ListeningDbClient<unknown>;

  public static async init(): Promise<void> {
    await messageQueueService.connect();

    this.instance = new Hapi.Server({
      host: config.public.host,
      port: config.public.port,
      tls: config.public.tls,
      app: {
        healthcheck: async (): Promise<boolean> => {
          await db.one('SELECT 1;');
          return messageQueueService.isConnected();
        },
      },
    });

    await registerPlugins(this.instance, {
      name: packageJson.name,
      version: packageJson.version,
    });

    await this.instance.start();
    this.instance.log(
      ['startup'],
      `Server running at ${this.instance.info.uri}`
    );

    TaskScheduler.init();

    this.listeningDbClient = new ListeningDbClient(db);
    this.listeningDbClient.on('connected', (client: IClient) => {
      this.registerDbNotifications(client).catch(console.error);
    });
    await this.listeningDbClient.connect();
  }

  public static async stop(): Promise<void> {
    TaskScheduler.stop();
    await this.listeningDbClient.disconnect();
    await this.instance.stop();
    this.instance.log(['startup'], `Server was stopped`);

    await messageQueueService.disconnect();
  }

  public static async terminate(): Promise<void> {
    await db.$pool.end();
  }

  private static async registerDbNotifications(client: IClient): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    client.on('notification', async function (msg: DatabaseNotification) {
      if (msg.name === 'notification') {
        try {
          const start = performance.now();

          const pl: ParsedDatabasePayload = JSON.parse(
            msg.payload,
            isoDateStringReviverFn
          ) as ParsedDatabasePayload;

          if (msg.channel === 'table_insert' && pl.table === 'questionnaires') {
            await NotificationHandlers.handleInsertedQuestionnaire(
              pl.row as Questionnaire
            );
          } else if (
            msg.channel === 'table_update' &&
            pl.table === 'questionnaires'
          ) {
            await NotificationHandlers.handleUpdatedQuestionnaire(
              pl.row_old as Questionnaire,
              pl.row_new as Questionnaire
            );
          } else if (
            msg.channel === 'table_update' &&
            pl.table === 'questionnaire_instances'
          ) {
            await NotificationHandlers.handleUpdatedInstance(
              pl.row_old as QuestionnaireInstance,
              pl.row_new as QuestionnaireInstance
            );
          } else {
            return;
          }
          console.log(
            "Processed '" +
              msg.channel +
              "' notification for table '" +
              pl.table +
              "'",
            '(took ' + Math.round(performance.now() - start).toString() + ' ms)'
          );
        } catch (err) {
          console.error(err);
        }
      }
    });
    await client.query('LISTEN table_update');
    await client.query('LISTEN table_insert');
  }
}
