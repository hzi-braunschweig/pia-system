/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface RegisterProbandResponse {
  success: boolean;
  message: string;
}

export interface UpdateProbandResponse {
  success: boolean;
  message: string;
  errors: Record<string, string>;
}

export interface DeactivateProbandResponse {
  success: boolean;
  message: string;
}

export interface ViewProbandModel {
  pseudonym: string;
  followUpEndDate: Date | null;
}
