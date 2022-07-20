/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProbandRole, ProfessionalRole } from './role';

export interface ProfessionalAccount {
  username: string;
  role: ProfessionalRole;
  studies: string[];
}

export interface ProbandAccount {
  username: string;
  role: ProbandRole;
  study: string;
}

export type Account = ProfessionalAccount | ProbandAccount;
