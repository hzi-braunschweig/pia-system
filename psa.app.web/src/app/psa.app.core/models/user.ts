/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyAccessOfUser } from './study_access';

export interface AccessToken {
  username: string;
  role: Role;
  groups: string[];
}

export type User = Omit<AccessToken, 'groups'> & { studies: string[] };

/**
 * The response for a login request. Currently it also gives
 * `username: string;` and `role: Role;` but it is not needed because it is also in the token.
 */
export interface LoginResponse {
  token: string;
  token_login: string;
  pw_change_needed: boolean;
}

export interface LoginToken {
  username: string;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
}

export type ProfessionalRole =
  | 'Forscher'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'Untersuchungsteam'
  | 'SysAdmin';

export type Role = ProfessionalRole | 'Proband';

export interface ProfessionalUser {
  username: string;
  role: ProfessionalRole;
  study_accesses: StudyAccessOfUser[];
}
