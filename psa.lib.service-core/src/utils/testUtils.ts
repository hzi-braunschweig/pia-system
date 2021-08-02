/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import JWT from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import sinon from 'sinon';

import { AccessToken } from '../auth/authModel';

/**
 * Allows to declare the type of a single method's stub.
 *
 * @example
 * let getSomethingMock: SinonMethodStub<typeof ExampleRepository.getSomething>
 *     = sandbox.stub(ExampleRepository, 'getSomething');
 */
export type SinonMethodStub<M extends (...args: any[]) => any> =
  sinon.SinonStub<Parameters<M>, ReturnType<M>>;

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
