/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { db } from '../db';

export class StudyAccessRepository {
  public static async getProbandsWithAcessToFromProfessional(
    professionalUserId: string
  ): Promise<string[]> {
    const users = await db.manyOrNone<{ pseudonym: string }>(
      `SELECT pseudonym
         FROM probands as p
       JOIN study_users su
         ON p.study = su.study_id
       WHERE
         su.user_id = $(professionalUserId)`,
      { professionalUserId }
    );
    return users.map((user) => user.pseudonym);
  }
}
