import JWT from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

import { AccessToken } from '../auth/authModel';

/**
 * Use this code only in your tests not in the server itself!
 * @param basePath Pass __dirpath from your test file
 */
export function getSecretOrPrivateKey(basePath: string): Buffer {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return fs.readFileSync(path.join(basePath, '../private.key'));
}

/**
 * Use this code only in your tests not in the server itself!
 * @param payload
 * @param secret
 */
export function signToken(
  payload: AccessToken,
  secret: string | Buffer
): string {
  return JWT.sign(payload, secret, {
    algorithm: 'RS512',
    expiresIn: '24h',
  });
}
