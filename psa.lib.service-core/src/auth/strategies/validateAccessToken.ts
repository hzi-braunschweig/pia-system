import pgPromise from 'pg-promise';
import {
  AccessToken,
  AuthToken,
  isAccessToken,
  TokenValidationFn,
  ValidationResult,
} from '../authModel';

/**
 * Factory for AccessToken validator function
 * @param db qPIA DB connection
 */
export function validateAccessToken(
  db?: pgPromise.IDatabase<unknown>
): TokenValidationFn<AccessToken> {
  if (!db) {
    console.warn(
      'validateAccessToken: ' +
        'AccessToken will be checked without database access. ' +
        'This is not allowed for services with qPIA DB access!'
    );
  }
  return async function (decoded: AuthToken): Promise<ValidationResult> {
    if (!isAccessToken(decoded)) {
      return { isValid: false };
    }
    if (!db) {
      return { isValid: true };
    }
    try {
      const result = await db.oneOrNone<unknown>(
        "SELECT username FROM users WHERE username=${username} AND role=${role} AND account_status!='deactivated'",
        {
          username: decoded.username,
          role: decoded.role,
        }
      );
      return { isValid: result !== null && result !== undefined };
    } catch (err) {
      console.log(err);
      return { isValid: false };
    }
  };
}
