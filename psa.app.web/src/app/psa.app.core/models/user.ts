/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { StudyAccessOfUser } from './studyAccess';

export interface User {
  username: string;
  role: Role;
  studies: string[];
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
