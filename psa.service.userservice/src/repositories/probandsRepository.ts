/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { getDbTransactionFromOptionsOrDbConnection } from '../db';
import { RepositoryOptions } from '@pia/lib-service-core';
import { ProbandStatus } from '../models/probandStatus';

export class ProbandsRepository {
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
