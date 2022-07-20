/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDbTransactionFromOptionsOrDbConnection } from '../db';

import {
  PendingDeletionDb,
  PendingDeletionRes,
} from '../models/pendingDeletion';
import { RepositoryOptions } from '@pia/lib-service-core';

export class PendingDeletionRepository {
  public static async getPendingDeletionsOfStudy(
    studyName: string,
    options?: RepositoryOptions
  ): Promise<PendingDeletionDb[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.manyOrNone<PendingDeletionDb>(
      'SELECT * FROM pending_deletions WHERE study=$(studyName)',
      { studyName }
    );
  }

  public static async getPendingDeletion(
    pseudonym: string,
    options?: RepositoryOptions
  ): Promise<PendingDeletionDb> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one<PendingDeletionDb>(
      'SELECT * FROM pending_deletions WHERE proband_id=$(probandId)',
      { probandId: pseudonym }
    );
  }

  public static async createPendingDeletion(
    deletion: PendingDeletionDb,
    options?: RepositoryOptions
  ): Promise<PendingDeletionRes> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.one(
      `INSERT INTO pending_deletions(requested_by, requested_for, proband_id, study)
             VALUES ($(requested_by), $(requested_for), $(proband_id), $(study))
             RETURNING *`,
      deletion
    );
  }

  public static async deletePendingDeletion(
    pseudonym: string,
    options: RepositoryOptions
  ): Promise<void> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    await db.none(
      'DELETE FROM pending_deletions WHERE proband_id=$(probandId)',
      { probandId: pseudonym }
    );
  }
}
