/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import schedule, { Job } from 'node-schedule';
import { messageQueueService } from './messageQueueService';

export class TaskScheduler {
  private static readonly jobs: Job[] = [];

  public static init(): void {
    TaskScheduler.scheduleFeedbackStatisticsUpdate();
  }

  public static stop(): void {
    while (this.jobs.length > 0) {
      this.jobs.pop()?.cancel();
    }
  }

  private static scheduleFeedbackStatisticsUpdate(): void {
    // Every day at 5:00 (UTC)
    this.jobs.push(
      schedule.scheduleJob(
        { hour: 5 },
        () => void messageQueueService.sendDataOutdated()
      )
    );
  }
}
