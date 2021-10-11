/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { CreateProband, Proband } from '../models/proband';
import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { PendingComplianceChange } from '../models/pendingComplianceChange';
import { RepositoryOptions } from '@pia/lib-service-core';

export class ProbandsRepository {
  public static async find(
    conditions: { studyName: string },
    options?: RepositoryOptions
  ): Promise<Proband[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    const query = `SELECT u.username                       AS "username",
                              u.ids                            AS "ids",
                              su.study_id                      AS "study",
                              u.study_status                   AS "studyStatus",
                              u.account_status                 AS "accountStatus",
                              compliance_labresults            AS "complianceLabresults",
                              compliance_samples               AS "complianceSamples",
                              compliance_bloodsamples          AS "complianceBloodsamples",
                              pcc.id                           AS "id",
                              pcc.requested_by                 AS "requested_by",
                              pcc.requested_for                AS "requested_for",
                              pcc.proband_id                   AS "proband_id",
                              pcc.compliance_labresults_from   AS "compliance_labresults_from",
                              pcc.compliance_labresults_to     AS "compliance_labresults_to",
                              pcc.compliance_samples_from      AS "compliance_samples_from",
                              pcc.compliance_samples_to        AS "compliance_samples_to",
                              pcc.compliance_bloodsamples_from AS "compliance_bloodsamples_from",
                              pcc.compliance_bloodsamples_to   AS "compliance_bloodsamples_to"
                       FROM users AS u
                                JOIN study_users su ON u.username = su.user_id
                                LEFT OUTER JOIN pending_compliance_changes pcc ON u.username = pcc.proband_id
                       WHERE u.role = 'Proband'
                         AND su.study_id = $(studyName)`;
    const probandsWithChanges = await db.manyOrNone<
      Proband & PendingComplianceChange
    >(query, conditions);
    return probandsWithChanges.map((probandWithChanges) => {
      const proband: Proband = {
        username: probandWithChanges.username,
        ids: probandWithChanges.ids,
        study: probandWithChanges.study,
        studyStatus: probandWithChanges.studyStatus,
        accountStatus: probandWithChanges.accountStatus,
        complianceLabresults: probandWithChanges.complianceLabresults,
        complianceSamples: probandWithChanges.complianceSamples,
        complianceBloodsamples: probandWithChanges.complianceBloodsamples,
        pendingComplianceChange: probandWithChanges.id
          ? {
              id: probandWithChanges.id,
              requested_by: probandWithChanges.requested_by,
              requested_for: probandWithChanges.requested_for,
              proband_id: probandWithChanges.proband_id,
              compliance_labresults_from:
                probandWithChanges.compliance_labresults_from,
              compliance_labresults_to:
                probandWithChanges.compliance_labresults_to,
              compliance_samples_from:
                probandWithChanges.compliance_samples_from,
              compliance_samples_to: probandWithChanges.compliance_samples_to,
              compliance_bloodsamples_from:
                probandWithChanges.compliance_bloodsamples_from,
              compliance_bloodsamples_to:
                probandWithChanges.compliance_bloodsamples_to,
            }
          : null,
      };
      return proband;
    });
  }

  public static async save(
    newProbandData: CreateProband,
    options?: RepositoryOptions
  ): Promise<void> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);

    await db.one<string>(
      `UPDATE users
             SET compliance_labresults=$(complianceLabresults),
                 compliance_samples=$(complianceSamples),
                 compliance_bloodsamples=$(complianceBloodsamples),
                 study_center=$(studyCenter),
                 examination_wave=$(examinationWave),
                 logging_active         = NOT s.has_logging_opt_in
             FROM studies AS s
             WHERE username = $(pseudonym)
               AND s.name = $(study)
             RETURNING username AS pseudonym`,
      newProbandData
    );

    // insert study access for those that did not exist earlier = those without ids
    if (!newProbandData.ids) {
      await db.none(
        `INSERT INTO study_users (study_id, user_id, access_level)
                 VALUES ($(study), $(pseudonym), 'read')`,
        newProbandData
      );
    }
  }

  public static async saveIDSProband(
    ids: string,
    study: string,
    options?: RepositoryOptions
  ): Promise<void> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    await db.one(
      `UPDATE users AS u
             SET ids                     = $(ids),
                 compliance_labresults   = FALSE,
                 compliance_samples      = FALSE,
                 compliance_bloodsamples = FALSE,
                 logging_active          = NOT s.has_logging_opt_in
             FROM studies AS s
             WHERE u.username = $(ids)
               AND s.name = $(study)
             RETURNING username AS pseudonym`,
      { ids, study }
    );

    await db.none(
      `INSERT INTO study_users (study_id, user_id, access_level)
             VALUES ($(study), $(pseudonym), 'read')`,
      { study, pseudonym: ids }
    );
  }
}
