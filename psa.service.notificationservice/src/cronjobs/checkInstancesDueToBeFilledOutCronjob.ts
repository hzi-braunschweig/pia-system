/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import Cronjob from './cronjob';
import { CronJob } from 'cron';
import * as postgresqlHelper from '../services/postgresqlHelper';
import { Cancelable } from '../models/cancelable';

// Check for questionnaires that are due to be filled out
export default class CheckInstancesDueToBeFilledOutCronjob implements Cronjob {
  public start(): Cancelable {
    const dueQuestionnairesJob = new CronJob(
      '*/10 * * * *',
      () => void this.execute(),
      null,
      true,
      'Europe/Berlin'
    );
    dueQuestionnairesJob.start();

    console.log('Questionnaire instances to be filled out cronjob started');

    return {
      cancel: (): void => {
        dueQuestionnairesJob.stop();
      },
    };
  }

  public async execute(): Promise<void> {
    const ids =
      (await postgresqlHelper.getNotFilledoutQuestionnaireInstanceIds()) as number[];
    for (const id of ids) {
      // 'await' used to prevent insert duplications
      await postgresqlHelper.insertContactProbandRecordForNotAnswered({
        questionnaireInstanceId: id,
      });
    }
  }
}
