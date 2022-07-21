/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  PendingPartialDeletionDb,
  PendingPartialDeletionReq,
  PendingPartialDeletionRes,
} from '../models/pendingPartialDeletion';
import { MarkOptional } from 'ts-essentials';

export class PendingPartialDeletionMapper {
  /**
   * Converts a db PendingPartialDeletion into a PendingPartialDeletion-response object for the API
   */
  public static mapDbPendingPartialDeletion(
    pendingPartialDeletion: PendingPartialDeletionDb
  ): PendingPartialDeletionRes {
    return {
      id: pendingPartialDeletion.id,
      requestedBy: pendingPartialDeletion.requested_by,
      requestedFor: pendingPartialDeletion.requested_for,
      probandId: pendingPartialDeletion.proband_id,
      fromDate: pendingPartialDeletion.from_date,
      toDate: pendingPartialDeletion.to_date,
      forInstanceIds: pendingPartialDeletion.for_instance_ids ?? null,
      forLabResultsIds: pendingPartialDeletion.for_lab_results_ids ?? null,
    };
  }
  /**
   * Converts a PendingPartialDeletion-request into a db PendingPartialDeletion object
   */
  public static mapReqPendingPartialDeletion(
    requestedBy: string,
    pendingPartialDeletion: PendingPartialDeletionReq
  ): MarkOptional<PendingPartialDeletionDb, 'id'> {
    return {
      requested_by: requestedBy,
      requested_for: pendingPartialDeletion.requestedFor,
      proband_id: pendingPartialDeletion.probandId,
      from_date: pendingPartialDeletion.fromDate,
      to_date: pendingPartialDeletion.toDate,
      for_instance_ids: pendingPartialDeletion.forInstanceIds,
      for_lab_results_ids: pendingPartialDeletion.forLabResultsIds,
    };
  }
}
