/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QueryFile } from 'pg-promise';
import * as path from 'path';

import { db } from '../../../../src/db';

const setupFile = new QueryFile(path.join(__dirname, 'setup.sql'), {
  minify: true,
});
const cleanupFile = new QueryFile(path.join(__dirname, 'cleanup.sql'), {
  minify: true,
});

export async function setup(): Promise<void> {
  await db.none(cleanupFile);
  await db.none(setupFile);
}

export async function cleanup(): Promise<void> {
  await db.none(cleanupFile);
}
