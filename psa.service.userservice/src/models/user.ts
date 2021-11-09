/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProfessionalRole, Role } from './role';
import { StudyStatus } from './proband';

export interface User {
  username: string;
  password?: string;
  role: Role;
  pw_change_needed: boolean;
  initial_password_validity_date?: Date;
  account_status: AccountStatus;
}

export type AccountStatus =
  | 'active'
  | 'deactivation_pending'
  | 'deactivated'
  | 'no_account';

export type StudyAccessLevel = 'read' | 'write' | 'admin';

export interface StudyAccess {
  study_id: string;
  user_id: string;
  access_level: StudyAccessLevel;
}

type StudyAccessOfUser = Omit<StudyAccess, 'user_id'>;

export interface UserWithStudyAccess extends User {
  study_accesses: StudyAccessOfUser[];
}

export interface CreateUserRequest {
  username: string; // email
  role: ProfessionalRole;
  study_accesses: StudyAccessOfUser[];
}

export interface UserResponse {
  username: string;
  role: Role;
  first_logged_in_at?: Date | null;
  study_accesses: StudyAccessOfUser[];
}

export interface ProbandResponse extends UserResponse {
  account_status: AccountStatus;
  study_status: StudyStatus;
  ids: string | null;
}

interface ProbandCompliances {
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  compliance_labresults: boolean;
}

export interface ProbandResponseForProfessionals
  extends ProbandResponse,
    ProbandCompliances {
  study_center: string | null;
  examination_wave: string | null;
  is_test_proband: boolean;
  logging_active: boolean;
}

export interface ProbandResponseForPm
  extends ProbandResponseForProfessionals,
    ProbandCompliances {
  pendingComplianceChange: unknown;
}
