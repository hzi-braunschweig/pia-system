/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { QueryFile } from 'pg-promise';
import * as path from 'path';

import { db } from '../../../src/db';

const setupGetFile = new QueryFile(path.join(__dirname, 'setupGet.sql'), {
  minify: true,
});
const setupPostFile = new QueryFile(path.join(__dirname, 'setupPost.sql'), {
  minify: true,
});
const setupPutFile = new QueryFile(path.join(__dirname, 'setupPut.sql'), {
  minify: true,
});
const setupDeleteFile = new QueryFile(path.join(__dirname, 'setupDelete.sql'), {
  minify: true,
});
const cleanupFile = new QueryFile(path.join(__dirname, 'cleanup.sql'), {
  minify: true,
});

export async function setupGet(): Promise<void> {
  await db.none(cleanupFile);
  await db.none(setupGetFile);
}

export async function setupPost(): Promise<void> {
  await db.none(cleanupFile);
  await db.none(setupPostFile);
}

export async function setupPut(): Promise<void> {
  await db.none(cleanupFile);
  await db.none(setupPutFile);
}

export async function setupDelete(): Promise<void> {
  await db.none(cleanupFile);
  await db.none(setupDeleteFile);
}

export async function cleanup(): Promise<void> {
  await db.none(cleanupFile);
}
