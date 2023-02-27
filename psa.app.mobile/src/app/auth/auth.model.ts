/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type ProfessionalRole =
  | 'Forscher'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'Untersuchungsteam'
  | 'SysAdmin';

export type Role = ProfessionalRole | 'Proband';

export interface AccessToken {
  username: string;
  role: Role;
  studies: string[];
  locale: string;
}

export interface User {
  username: string;
  study: string;
  locale: string;
}
