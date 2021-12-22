/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Role } from './role';

export interface CreateAccountRequest {
  username: string;
  password: string;
  role: Role;
  pwChangeNeeded: boolean;
  initialPasswordValidityDate?: Date;
}
