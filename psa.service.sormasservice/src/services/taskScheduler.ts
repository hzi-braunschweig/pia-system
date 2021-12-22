/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import schedule, { Job } from 'node-schedule';
import { ExpiredUsersDeletionService } from './expiredUsersDeletionService';

export class TaskScheduler {
  private static readonly jobs: Job[] = [];

  public static init(): void {
    TaskScheduler.scheduleUpdatingProbandsAfterFollowUpEndDate();
    TaskScheduler.scheduleDeletingProbandsAfterFollowUpEndDateAndQIsTransmitted();
  }

  public static stop(): void {
    while (this.jobs.length > 0) {
      this.jobs.pop()!.cancel();
    }
  }

  private static scheduleUpdatingProbandsAfterFollowUpEndDate(): void {
    // Every hour at the 0. minute
    this.jobs.push(
      schedule.scheduleJob(
        { minute: 0 },
        () =>
          void ExpiredUsersDeletionService.setProbandsDeactivatedIfFollowUpEndDateIsReached().catch(
            (e) => {
              console.error(e);
            }
          )
      )
    );
  }

  private static scheduleDeletingProbandsAfterFollowUpEndDateAndQIsTransmitted(): void {
    // Once a day at 1 am UTC
    this.jobs.push(
      schedule.scheduleJob(
        { hour: 1, minute: 0 },
        () =>
          void ExpiredUsersDeletionService.deleteProbandsIfEveryQIIsReleasedAndTransmitted().catch(
            (e) => {
              console.error(e);
            }
          )
      )
    );
  }
}
