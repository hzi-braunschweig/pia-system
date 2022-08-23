/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingPartialDeletionReq {
  requestedFor: string;
  probandId: string;
  fromDate: Date;
  toDate: Date;
  forInstanceIds: number[] | null;
  forLabResultsIds: string[] | null;
}

export interface PendingPartialDeletionRes extends PendingPartialDeletionReq {
  id: number;
  requestedBy: string;
}

export interface PendingPartialDeletionDb {
  id: number;
  requested_by: string;
  requested_for: string;
  proband_id: string;
  from_date: Date;
  to_date: Date;
  for_instance_ids: number[] | null;
  for_lab_results_ids: string[] | null;
}
