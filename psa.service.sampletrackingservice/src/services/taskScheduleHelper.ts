/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RecurrenceRule, Job, scheduleJob } from 'node-schedule';
import { LabResultImportHelper } from './labResultImportHelper';

/**
 * helper methods to schedule recurring tasks
 */
export class TaskScheduleHelper {
  public static scheduleDailyHL7Import(): Job {
    // Once a day at 3 am
    const rule = new RecurrenceRule();
    rule.hour = 3;
    rule.minute = 0;

    return scheduleJob(rule, () => {
      void LabResultImportHelper.importHl7FromMhhSftp();
    });
  }

  public static scheduleDailyCsvImport(): Job {
    // Once a day at 4 am
    const rule = new RecurrenceRule();
    rule.hour = 4;
    rule.minute = 0;

    return scheduleJob(rule, function () {
      void LabResultImportHelper.importCsvFromHziSftp();
    });
  }
}
