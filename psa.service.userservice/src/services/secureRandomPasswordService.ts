/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import generator from 'generate-password';

import { config } from '../config';

const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const WEEKS_PER_MONTH = 4;

/**
 * Generates cryptographically secure passwords
 */
export class SecureRandomPasswordService {
  private static readonly MINIMUM_PASSWORD_LENGTH = 10;
  private static readonly INITIAL_PASSWORD_VALIDITY =
    HOURS_PER_DAY * DAYS_PER_WEEK * WEEKS_PER_MONTH; // four weeks in hours

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

  public static generateInitialPasswordValidityDate(): Date {
    // Set initial password validity period to four weeks after the user was created
    const initialPasswordValidityDate = new Date();
    initialPasswordValidityDate.setHours(
      initialPasswordValidityDate.getHours() + this.INITIAL_PASSWORD_VALIDITY
    );
    return initialPasswordValidityDate;
  }

  private static getPasswordLength(): number {
    if (config.userPasswordLength >= this.MINIMUM_PASSWORD_LENGTH) {
      return config.userPasswordLength;
    } else {
      return this.MINIMUM_PASSWORD_LENGTH;
    }
  }
}
