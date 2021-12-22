/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingPartialDeletionResponse {
  id: number;
  requestedBy: string;
  requestedFor: string;
  probandId: string;
  fromDate: Date;
  toDate: Date;
  forInstanceIds: number[] | null;
  forLabResultsIds: string[] | null;
}

export interface PendingPartialDeletionRequest {
  requestedFor: string;
  probandId: string;
  fromDate: Date;
  toDate: Date;
  forInstanceIds: number[] | null;
  forLabResultsIds: string[] | null;
}
