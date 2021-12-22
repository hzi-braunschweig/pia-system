/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface Proband {
  pseudonym: string;
  first_logged_in_at: Date | null;
  study: string;
  status: ProbandStatus;
  ids: string | null;
  needs_material: boolean;
  study_center: string | null;
  examination_wave: number | null;
  is_test_proband: boolean;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
}

export type ProbandStatus = 'active' | 'deactivated' | 'deleted';
