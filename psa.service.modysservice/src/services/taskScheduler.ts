/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as schedule from 'node-schedule';
import { ModysImportService } from './modysImportService';

export class TaskScheduler {
  private static job: schedule.Job;

  public static init(): void {
    TaskScheduler.scheduleUpdatesFromModys();
  }

  public static stop(): void {
    this.job.cancel();
  }

  private static scheduleUpdatesFromModys(): void {
    void ModysImportService.startImport();

    // Once a day at 10 pm
    this.job = schedule.scheduleJob(
      { hour: 22, minute: 0 },
      () => void ModysImportService.startImport()
    );
  }
}
