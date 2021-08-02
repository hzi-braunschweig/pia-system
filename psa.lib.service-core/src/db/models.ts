/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface DatabaseNotification {
  name: string;
  payload: string;
  channel: string;
}

export interface ParsedDatabasePayload {
  table: string;
  row: unknown;
  row_old: unknown;
  row_new: unknown;
}
