/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingDeletionReq {
  id: number;
  requested_by: string;
  requested_for: string;
  proband_id: string;
}

export interface PendingDeletionDb extends PendingDeletionReq {
  study: string;
}

export type PendingDeletionRes = PendingDeletionDb;
