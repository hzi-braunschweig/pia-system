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

export type AccountStatus =
  | 'active'
  | 'deactivated'
  | 'deactivation_pending'
  | 'no_account';

export interface User {
  username: string;
  password?: string;
  role?: Role;
  pw_change_needed?: boolean;
  initial_password_validity_date?: Date;
  account_status?: AccountStatus;
}
