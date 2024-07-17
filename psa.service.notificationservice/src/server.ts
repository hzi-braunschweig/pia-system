/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as Hapi from '@hapi/hapi';
import { IClient } from 'pg-promise/typescript/pg-subset';
import {
  DatabaseNotification,
  defaultPublicRoutesPaths,
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
import { LabResult } from './models/labResult';
import { DbQuestionnaireInstance } from './models/questionnaireInstance';
import { messageQueueService } from './services/messageQueueService';
import { Cronjobs } from './cronjobs';
import { Cancelable } from './models/cancelable';

export class Server {
  private static server: Hapi.Server;
  private static cronjobs: Cancelable[];
  private static listeningDbClient: ListeningDbClient<unknown>;

  public static async init(): Promise<void> {
    this.server = Hapi.server({
      host: config.public.host,
      port: config.public.port,
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

    await registerAuthStrategies(this.server, config.servers.authserver);
    await registerPlugins(this.server, {
      name: packageJson.name,
      version: packageJson.version,
      routes: defaultPublicRoutesPaths,
    });

    await this.server.start();
    this.server.log(['startup'], `Server running at ${this.server.info.uri}`);

    MailService.initService(config.servers.mailserver);

    this.listeningDbClient = new ListeningDbClient(db);
    this.listeningDbClient.on('connected', (client: IClient) => {
      Server.registerDbNotifications(client).catch(console.error);
    });
    await this.listeningDbClient.connect();
    await messageQueueService.connect();
    FcmHelper.initFBAdmin();

    // Start cronjobs after service has been initialized
    this.cronjobs = Cronjobs.map((job) => job.start());
  }

  public static async stop(): Promise<void> {
    this.cronjobs.forEach((job) => job.cancel());

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
            `Processed '${msg.channel}' notification for table '${pl.table}'`
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
