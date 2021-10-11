/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { PlannedProband } from '../models/plannedProband';
import { RepositoryOptions } from '@pia/lib-service-core';

export class PlannedProbandsRepository {
  public static async find(
    conditions: {
      pseudonym: string;
      study: string;
    },
    options?: RepositoryOptions
  ): Promise<PlannedProband> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one<PlannedProband>(
      `SELECT pp.user_id      AS "pseudonym",
                    spp.study_id    AS "study",
                    pp.password     AS "password",
                    pp.activated_at AS "activatedAt"
             FROM planned_probands AS pp
                      JOIN study_planned_probands AS spp ON pp.user_id = spp.user_id
             WHERE pp.user_id = $(pseudonym)
               AND spp.study_id = $(study)
               AND pp.activated_at IS NULL`,
      conditions
    );
  }

  public static async save(
    plannedProband: PlannedProband,
    options?: RepositoryOptions
  ): Promise<void> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    await db.one(
      `UPDATE planned_probands AS pp
             SET activated_at=$(activatedAt)
             FROM study_planned_probands AS spp
             WHERE pp.user_id = $(pseudonym)
               AND pp.user_id = spp.user_id
               AND spp.study_id = $(study)
             RETURNING 1`,
      plannedProband
    );
  }
}
