/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface StudyAddress {
  /**
   * study name
   */
  name: string;

  /**
   * address string (may contain HTML)
   */
  address: string;
}
