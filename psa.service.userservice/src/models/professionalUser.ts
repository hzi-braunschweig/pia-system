/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProfessionalRole } from './role';

export interface ProfessionalUser {
  username: string;
  role: ProfessionalRole;
  studies: string[];
}
