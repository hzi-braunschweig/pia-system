/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * The analyzerservice reacts on PG-Notifications, that get thrown
 * by the trigger for INSERT, UPDATE or DELETE statements.
 * This trigger.helper.js can be used to disable and enable the triggers
 * during setup or cleanup so their db actions do not create any unwanted
 * reaction from the analyzerservice, even though the listeningDbClient is
 * still listening for notifications.
 */

import { QueryFile } from 'pg-promise';
import * as path from 'path';

import { db } from '../../../src/db';

const enableFile = new QueryFile(path.join(__dirname, 'enable.sql'), {
  minify: true,
});
const disableFile = new QueryFile(path.join(__dirname, 'disable.sql'), {
  minify: true,
});

export async function enable(): Promise<void> {
  await db.none(enableFile);
}

export async function disable(): Promise<void> {
  await db.none(disableFile);
}
