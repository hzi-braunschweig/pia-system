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
    const users = await db.manyOrNone<{ username: string }>(
      `SELECT u.username
                 FROM users as u
                          JOIN study_users su1 on u.username = su1.user_id
                          JOIN study_users as su2 ON su1.study_id = su2.study_id
                 WHERE su2.user_id = $(professionalUserId)
                   AND u.role = 'Proband'`,
      { professionalUserId }
    );
    return users.map((user) => user.username);
  }
}
