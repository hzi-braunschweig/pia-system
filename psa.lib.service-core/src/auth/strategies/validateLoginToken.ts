/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import pgPromise from 'pg-promise';
import {
  AuthToken,
  isLoginToken,
  LoginToken,
  TokenValidationFn,
  ValidationResult,
} from '../authModel';

/**
 * Factory for LoginToken validator function
 * @param db qPIA DB connection
 */
export function validateLoginToken(
  db?: pgPromise.IDatabase<unknown>
): TokenValidationFn<LoginToken> {
  if (!db) {
    throw new Error(
      'validateLoginToken: Missing database connection. Validation needs database access!'
    );
  }
  return async function (decoded: AuthToken): Promise<ValidationResult> {
    if (!isLoginToken(decoded)) {
      return { isValid: false };
    }
    try {
      const result = await db.oneOrNone<unknown>(
        "SELECT username FROM users WHERE username=${username} AND account_status!='deactivated'",
        {
          username: decoded.username,
        }
      );
      return { isValid: result !== null && result !== undefined };
    } catch (err) {
      console.log(err);
      return { isValid: false };
    }
  };
}
