/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * The participant's account status
 */
export enum AccountStatus {
  /**
   * The participant has an account with which he/she can
   * log in and use the app
   */
  ACCOUNT = 'account',
  /**
   * The participant has no account and cannot use the app
   * by himself/herself. However, professional roles might
   * answer questionnaires on behalf of the participant.
   */
  NO_ACCOUNT = 'no_account',
}
