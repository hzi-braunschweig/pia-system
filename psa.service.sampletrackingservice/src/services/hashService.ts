/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as crypto from 'crypto';

export class HashService {
  /**
   * Creates a MD5 hash from a string
   */
  public static createMd5Hash(input: string): string {
    return crypto.createHash('md5').update(input).digest('hex');
  }
}
