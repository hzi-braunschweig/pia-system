/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as schedule from 'node-schedule';
import { QuestionnaireInstancesService } from './questionnaireInstancesService';

export class TaskScheduler {
  private static job: schedule.Job;

  public static init(): void {
    TaskScheduler.scheduleQuestionnaireInstancesActivator();
  }

  public static stop(): void {
    this.job.cancel();
  }

  private static scheduleQuestionnaireInstancesActivator(): void {
    // Once every hour, add 5 min to catch instances at the full hour
    this.job = schedule.scheduleJob(
      { minute: 5 },
      () =>
        void QuestionnaireInstancesService.checkAndUpdateQuestionnaireInstancesStatus()
    );
  }
}
