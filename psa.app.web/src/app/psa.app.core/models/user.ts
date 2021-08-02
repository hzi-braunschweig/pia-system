/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyAccess } from './study_access';

export class User {
  id: number;
  username: string;
  password: string;
  token: string;
  first_logged_in_at: string;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  needs_material: boolean;
  pw_change_needed: boolean;
  role: Role;
  study_center: string;
  examination_wave: number;
  ids: string | null;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword1: string;
  newPassword2: string;
}

export interface PasswordChangeResponse {
  compliance_labresults: boolean;
  first_logged_in_at: string;
  pw_change_needed: boolean;
  role: string;
}

export interface UserWithSameRole {
  username: string;
  role: Role;
  study_accesses: StudyAccess[];
}

export type Role =
  | 'Proband'
  | 'Forscher'
  | 'Untersuchungsteam'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'SysAdmin';
