/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Role } from './user';

export interface UserListResponse {
  users: UserWithStudyAccess[];
  links: { self: { href: string } };
}

export interface UserWithStudyAccess {
  username: string;
  role: Role;
  is_test_proband: boolean;
  study_accesses: StudyAccess[];
  studyNamesArray: string[];
  first_logged_in_at: string;
  account_status: AccountStatus;
  study_status: StudyStatus;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  study_center: string;
  examination_wave: number;
  ids: string | null;
  needs_material: boolean;
  pendingComplianceChange?: boolean; // Not from backend
}

export interface StudyAccess {
  study_id: string;
  access_level: AccessLevel;
}

export type AccountStatus =
  | 'active'
  | 'deactivation_pending'
  | 'deactivated'
  | 'no_account';
export type StudyStatus = 'active' | 'deletion_pending' | 'deleted';
export type AccessLevel = 'read' | 'write' | 'admin';

export interface SormasProband {
  pseudonym: string;
  password: string | null; // null if registration mail was successfully sent
}
