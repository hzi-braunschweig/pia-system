/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

class PendingPartialDeletionMapper {
  /**
   * Converts a db PendingPartialDeletion into a PendingPartialDeletion-response object for the API
   * @param {PendingPartialDeletionDb} pendingPartialDeletion
   * @return {PendingPartialDeletionRes}
   */
  static mapDbPendingPartialDeletion(pendingPartialDeletion) {
    return {
      id: pendingPartialDeletion.id,
      requestedBy: pendingPartialDeletion.requested_by,
      requestedFor: pendingPartialDeletion.requested_for,
      probandId: pendingPartialDeletion.proband_id,
      fromDate: pendingPartialDeletion.from_date,
      toDate: pendingPartialDeletion.to_date,
      deleteLogs: pendingPartialDeletion.delete_logs,
      forInstanceIds: pendingPartialDeletion.for_instance_ids,
      forLabResultsIds: pendingPartialDeletion.for_lab_results_ids,
    };
  }
  /**
   * Converts a PendingPartialDeletion-request into a db PendingPartialDeletion object
   * @param {string} requestedBy name of the requesting user
   * @param {PendingPartialDeletionReq} pendingPartialDeletion
   * @return {PendingPartialDeletionDb}
   */
  static mapReqPendingPartialDeletion(requestedBy, pendingPartialDeletion) {
    return {
      requested_by: requestedBy,
      requested_for: pendingPartialDeletion.requestedFor,
      proband_id: pendingPartialDeletion.probandId,
      from_date: pendingPartialDeletion.fromDate,
      to_date: pendingPartialDeletion.toDate,
      delete_logs: pendingPartialDeletion.deleteLogs,
      for_instance_ids: pendingPartialDeletion.forInstanceIds,
      for_lab_results_ids: pendingPartialDeletion.forLabResultsIds,
    };
  }
}

module.exports = PendingPartialDeletionMapper;
