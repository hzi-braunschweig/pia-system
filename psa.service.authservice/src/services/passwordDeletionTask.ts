/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import schedule, { Job } from 'node-schedule';
import { db } from '../db';
import subHours from 'date-fns/subHours';

export function schedulePasswordDeletion(): Job {
  // Once every hour at 30 minutes
  const passwordValidityPeriod = 48; // in hours
  const rule = new schedule.RecurrenceRule();
  rule.minute = 30;

  return schedule.scheduleJob(rule, () => {
    deleteAllDuePasswords(passwordValidityPeriod).catch(console.error);
  });
}

async function deleteAllDuePasswords(validityPeriod: number): Promise<void> {
  const deletedPasswords = await db.manyOrNone(
    'DELETE FROM planned_probands WHERE activated_at < $1 RETURNING user_id',
    [subHours(new Date(), validityPeriod)]
  );
  console.log(`Deleted ${deletedPasswords.length} passwords`);
}
