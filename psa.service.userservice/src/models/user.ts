/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProfessionalRole } from './role';

export type StudyAccessLevel = 'read' | 'write' | 'admin';

export interface StudyAccess {
  study_id: string;
  user_id: string;
  access_level: StudyAccessLevel;
}

export interface StudyAccessOfUser {
  study_id: string;
  access_level: StudyAccessLevel;
}

export interface StudyAccess extends StudyAccessOfUser {
  user_id: string;
}

export interface CreateProfessionalUser {
  username: string; // email
  role: ProfessionalRole;
  study_accesses: StudyAccessOfUser[];
  temporaryPassword?: boolean;
}
