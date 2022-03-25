/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RepositoryOptions } from '@pia/lib-service-core';
import { Proband } from '../models/proband';
import { getDbTransactionFromOptionsOrDbConnection } from '../db';

export class ProbandsRepository {
  public static async findOneOrFail(
    pseudonym: string,
    options?: RepositoryOptions
  ): Promise<Proband> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return await db.one<Proband>(
      `SELECT pseudonym,
                first_logged_in_at,
                study,
                status,
                ids,
                needs_material,
                study_center,
                examination_wave,
                is_test_proband,
                compliance_labresults,
                compliance_samples,
                compliance_bloodsamples
         FROM probands
         WHERE pseudonym = $(pseudonym)`,
      { pseudonym }
    );
  }

  public static async updateFirstLoggedInAt(
    pseudonym: string,
    firstLoggedInAt: Date,
    options?: RepositoryOptions
  ): Promise<Proband> {
    const db = getDbTransactionFromOptionsOrDbConnection(options);
    return db.one<Proband>(
      `UPDATE probands SET first_logged_in_at = $(firstLoggedInAt) 
                WHERE pseudonym = $(pseudonym) 
                RETURNING 
                    pseudonym,
                    first_logged_in_at,
                    study,
                    status,
                    ids,
                    needs_material,
                    study_center,
                    examination_wave,
                    is_test_proband,
                    compliance_labresults,
                    compliance_samples,
                    compliance_bloodsamples`,
      { pseudonym, firstLoggedInAt }
    );
  }
}
