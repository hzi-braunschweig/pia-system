/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ProfessionalRole } from './user';

export interface ProfessionalAccount {
  username: string;
  role: ProfessionalRole;
  studies: string[];
}
