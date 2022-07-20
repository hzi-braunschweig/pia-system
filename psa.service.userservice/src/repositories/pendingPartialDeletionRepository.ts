/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { RepositoryOptions } from '@pia/lib-service-core';
import { PendingPartialDeletionDb } from '../models/pendingPartialDeletion';
import { MarkOptional } from 'ts-essentials';

export class PendingPartialDeletionRepository {
  public static async createPendingPartialDeletion(
    data: MarkOptional<PendingPartialDeletionDb, 'id'>,
    options: RepositoryOptions
  ): Promise<PendingPartialDeletionDb> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      `INSERT INTO pending_partial_deletions(requested_by, requested_for, proband_id, from_date, to_date, for_instance_ids,
                                                   for_lab_results_ids)
             VALUES ($(requested_by), $(requested_for), $(proband_id), $(from_date), $(to_date), $(for_instance_ids),
                     $(for_lab_results_ids))
             RETURNING *`,
      data
    );
  }

  /**
   * Executes the pending partial deletion, performs all delete actions associated with it and deletes the db entry
   */
  public static async executePendingPartialDeletion(
    id: number,
    options: RepositoryOptions
  ): Promise<PendingPartialDeletionDb> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    const pendingPartialDeletion = await db.one<PendingPartialDeletionDb>(
      'SELECT * FROM pending_partial_deletions WHERE id=$(id)',
      { id }
    );

    if (
      pendingPartialDeletion.for_lab_results_ids &&
      pendingPartialDeletion.for_lab_results_ids.length > 0
    ) {
      await db.none(
        'DELETE FROM lab_results WHERE id IN ($(for_lab_results_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        "DELETE FROM notification_schedules WHERE reference_id IN ($(for_lab_results_ids:csv)) AND notification_type='sample'",
        pendingPartialDeletion
      );
    }

    if (
      pendingPartialDeletion.for_instance_ids &&
      pendingPartialDeletion.for_instance_ids.length > 0
    ) {
      await db.none(
        'DELETE FROM user_files WHERE questionnaire_instance_id IN ($(for_instance_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        'DELETE FROM answers WHERE questionnaire_instance_id IN ($(for_instance_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        'DELETE FROM questionnaire_instances_queued WHERE questionnaire_instance_id IN ($(for_instance_ids:csv))',
        pendingPartialDeletion
      );
      await db.none(
        "DELETE FROM notification_schedules WHERE reference_id::int IN ($(for_instance_ids:csv)) AND notification_type='qReminder'",
        pendingPartialDeletion
      );
      await db.none(
        `UPDATE questionnaire_instances
                 SET date_of_release_v1=NULL,
                     date_of_release_v2=NULL,
                     cycle=0,
                     status='deleted',
                     notifications_scheduled= TRUE
                 WHERE id IN ($(for_instance_ids:csv))`,
        pendingPartialDeletion
      );
    }
    return await db.one(
      'DELETE FROM pending_partial_deletions WHERE id=$(id) RETURNING *',
      { id }
    );
  }

  /**
   * Deletes the pending partial deletion and cancels all delete actions associated with it
   */
  public static async deletePendingPartialDeletion(
    id: number,
    options: RepositoryOptions
  ): Promise<null> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.none(
      'DELETE FROM pending_partial_deletions WHERE id=$(id)',
      { id }
    );
  }

  public static async getPendingPartialDeletion(
    id: number,
    options?: RepositoryOptions
  ): Promise<PendingPartialDeletionDb> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one(
      'SELECT * FROM pending_partial_deletions WHERE id=$(id)',
      { id }
    );
  }
}
