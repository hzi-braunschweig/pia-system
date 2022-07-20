/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export const professionalRoles: ProfessionalRole[] = [
  'Forscher',
  'ProbandenManager',
  'EinwilligungsManager',
  'Untersuchungsteam',
  'SysAdmin',
];

export type ProfessionalRole =
  | 'Forscher'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'Untersuchungsteam'
  | 'SysAdmin';

export type ProbandRole = 'Proband';

export type Role = ProfessionalRole | ProbandRole;
