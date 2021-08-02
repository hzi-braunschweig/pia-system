/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type Role =
  | 'Proband'
  | 'Forscher'
  | 'Untersuchungsteam'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'SysAdmin';

export interface AccessToken {
  role: Role;
  username: string;
  groups: string[];
}
