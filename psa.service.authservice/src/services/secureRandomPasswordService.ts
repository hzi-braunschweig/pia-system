/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import generator from 'generate-password';

import { config } from '../config';

/**
 * Generates cryptographically secure passwords
 */
export class SecureRandomPasswordService {
  private static readonly MINIMUM_PASSWORD_LENGTH = 10;

  /**
   * Returns a random password with requirements
   */
  public static generate(): string {
    return generator.generate({
      length: this.getPasswordLength(),
      numbers: true,
      symbols: '-?*!()&:=/#+%',
      uppercase: true,
      strict: true,
      excludeSimilarCharacters: true,
    });
  }

  private static getPasswordLength(): number {
    if (config.minUserPasswordLength >= this.MINIMUM_PASSWORD_LENGTH) {
      return config.minUserPasswordLength;
    } else {
      return this.MINIMUM_PASSWORD_LENGTH;
    }
  }
}
