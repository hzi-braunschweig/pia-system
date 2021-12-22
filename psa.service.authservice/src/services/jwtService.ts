/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import JWT, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db';

const TOKEN_AUTH_TTL_PROBANDS = '24h';
const TOKEN_AUTH_TTL_PROFESSIONALS = '10h';
const TOKEN_LOGIN_TTL = '182d';

export class JwtService {
  public static async createAccessToken({
    locale,
    role,
    username,
  }: {
    locale: string;
    role: string;
    username: string;
  }): Promise<string> {
    const isProband = role === 'Proband';
    const expiresIn = isProband
      ? TOKEN_AUTH_TTL_PROBANDS
      : TOKEN_AUTH_TTL_PROFESSIONALS;

    let studies: string[];
    if (isProband) {
      const user = await db.one<{ study: string }>(
        'SELECT study FROM probands WHERE pseudonym = $(username)',
        { username }
      );
      studies = [user.study];
    } else {
      const studyAccesses = await db.manyOrNone<{ study_id: string }>(
        'SELECT study_id FROM study_users WHERE user_id = $(username)',
        { username }
      );
      studies = studyAccesses.map((access) => access.study_id);
    }

    const session = {
      id: 1,
      role,
      username,
      groups: studies,

      locale,
    };

    return JwtService.sign(session, expiresIn);
  }

  public static createLoginToken({ username }: { username: string }): string {
    const session = {
      id: 2,
      username,
    };

    return JwtService.sign(session, TOKEN_LOGIN_TTL);
  }

  private static sign(
    session: Record<string, unknown>,
    expiresIn: string
  ): string {
    const options: SignOptions = {
      algorithm: 'RS512',
      expiresIn,
    };

    return JWT.sign(session, config.privateAuthKey, options);
  }
}
