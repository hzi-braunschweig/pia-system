/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProbandResponse, ProbandResponseNew } from '../models/proband';
import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { RepositoryOptions } from '@pia/lib-service-core';
import { ProbandStatus } from '../models/probandStatus';

export class ProbandsRepository {
  public static async find(
    conditions: {
      studyName: string;
    },
    options?: RepositoryOptions
  ): Promise<ProbandResponseNew[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.manyOrNone<ProbandResponseNew>(
      `SELECT pseudonym,
                first_logged_in_at      AS "firstLggedInAt",
                study                   AS "study",
                compliance_labresults   AS "complianceLabresults",
                compliance_samples      AS "complianceSamples",
                compliance_bloodsamples AS "complianceBloodsamples",
                compliance_contact      AS "complianceContact",

                (CASE
                  WHEN a.username IS NULL THEN 'no_account'
                  ELSE 'account'
                  END
                ) AS "accountStatus",

                status                  AS "status",
                ids                     AS "ids",
                needs_material          AS "needsMaterial",
                study_center            AS "studyCenter",
                examination_wave        AS "examinationWave",
                is_test_proband         AS "isTestProband"
         FROM probands
         LEFT OUTER JOIN accounts as a ON a.username = pseudonym AND a.role = 'Proband'
         WHERE study = $(studyName)`,
      conditions
    );
  }

  public static async getProband(
    pseudonym: string,
    options?: RepositoryOptions
  ): Promise<ProbandResponse | null> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.oneOrNone<ProbandResponse>(
      `SELECT pseudonym,
                first_logged_in_at,
                study                   AS study,
                compliance_labresults   AS "complianceLabresults",
                compliance_samples      AS "complianceSamples",
                compliance_bloodsamples AS "complianceBloodsamples",
                compliance_contact      AS "complianceContact",

                (CASE
                  WHEN a.username IS NULL THEN 'no_account'
                  ELSE 'account'
                  END
                ) AS "accountStatus",

                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband
         FROM probands
         LEFT OUTER JOIN accounts as a ON a.username = pseudonym AND a.role = 'Proband'
         WHERE pseudonym = $(pseudonym)`,
      { pseudonym }
    );
  }

  public static async getProbandByIDS(
    ids: string,
    options?: RepositoryOptions
  ): Promise<ProbandResponse | null> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.oneOrNone<ProbandResponse>(
      `SELECT pseudonym,
                first_logged_in_at,
                study                   AS study,
                compliance_labresults   AS "complianceLabresults",
                compliance_samples      AS "complianceSamples",
                compliance_bloodsamples AS "complianceBloodsamples",
                compliance_contact      AS "complianceContact",

                (CASE
                  WHEN a.username IS NULL THEN 'no_account'
                  ELSE 'account'
                  END
                ) AS "accountStatus",

                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband
         FROM probands
         LEFT OUTER JOIN accounts as a ON a.username = pseudonym AND a.role = 'Proband'
         WHERE ids = $(ids)`,
      { ids }
    );
  }

  public static async getProbandAsProfessional(
    pseudonym: string,
    requesterStudies: string[],
    options?: RepositoryOptions
  ): Promise<ProbandResponse> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one<ProbandResponse>(
      `SELECT pseudonym,
                first_logged_in_at,
                study                   AS study,
                compliance_labresults   AS "complianceLabresults",
                compliance_samples      AS "complianceSamples",
                compliance_bloodsamples AS "complianceBloodsamples",
                compliance_contact      AS "complianceContact",

                (CASE
                  WHEN a.username IS NULL THEN 'no_account'
                  ELSE 'account'
                  END
                ) AS "accountStatus",

                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband
         FROM probands
         LEFT OUTER JOIN accounts as a ON a.username = pseudonym AND a.role = 'Proband'
         WHERE pseudonym = $(pseudonym)
           AND study IN ($(requesterStudies:csv))`,
      { pseudonym, requesterStudies }
    );
  }

  public static async getProbandByIdsAsProfessional(
    ids: string,
    requesterStudies: string[],
    options?: RepositoryOptions
  ): Promise<ProbandResponse | null> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.oneOrNone<ProbandResponse>(
      `SELECT pseudonym,
                first_logged_in_at,
                study                   AS study,
                compliance_labresults   AS "complianceLabresults",
                compliance_samples      AS "complianceSamples",
                compliance_bloodsamples AS "complianceBloodsamples",
                compliance_contact      AS "complianceContact",

                (CASE
                  WHEN a.username IS NULL THEN 'no_account'
                  ELSE 'account'
                  END
                ) AS "accountStatus",

                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband
         FROM probands
         LEFT OUTER JOIN accounts as a ON a.username = pseudonym AND a.role = 'Proband'
         WHERE ids = $(ids)
           AND study IN ($(requesterStudies:csv))`,
      { ids, requesterStudies }
    );
  }

  public static async getProbandsAsProfessional(
    requesterStudies: string[],
    options?: RepositoryOptions
  ): Promise<ProbandResponse[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.manyOrNone<ProbandResponse>(
      `SELECT pseudonym,
                first_logged_in_at,
                study                   AS study,
                compliance_labresults   AS "complianceLabresults",
                compliance_samples      AS "complianceSamples",
                compliance_bloodsamples AS "complianceBloodsamples",
                compliance_contact      AS "complianceContact",

                (CASE
                  WHEN a.username IS NULL THEN 'no_account'
                  ELSE 'account'
                  END
                ) AS "accountStatus",

                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband
         FROM probands
         LEFT OUTER JOIN accounts as a ON a.username = pseudonym AND a.role = 'Proband'
         WHERE study IN ($(requesterStudies:csv))`,
      { requesterStudies }
    );
  }

  public static async getPseudonyms(
    study?: string,
    status?: ProbandStatus,
    complianceContact?: boolean,
    options?: RepositoryOptions
  ): Promise<string[]> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    let query = 'SELECT pseudonym FROM probands\n';
    query += 'WHERE true\n';
    if (study) {
      query += 'AND study = $(study)\n';
    }
    if (status && status.length > 0) {
      query += 'AND status IN ($(status:csv))';
    }
    if (typeof complianceContact === 'boolean') {
      query += 'AND compliance_contact = $(complianceContact)';
    }
    return db
      .manyOrNone<{ pseudonym: string }>(query, {
        study,
        status,
        complianceContact,
      })
      .then((result) => result.map((row) => row.pseudonym));
  }
}
