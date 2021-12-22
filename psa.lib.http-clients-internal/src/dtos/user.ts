/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type ProfessionalRole =
  | 'Forscher'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'Untersuchungsteam';

export type Role = ProfessionalRole | 'Proband';

export interface CreateAccountRequestInternalDto {
  username: string;
  password: string;
  role: Role;
  pwChangeNeeded: boolean;
  initialPasswordValidityDate?: Date;
}
