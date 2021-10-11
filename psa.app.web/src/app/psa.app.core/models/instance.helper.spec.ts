/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Studie } from './studie';
import { UserWithStudyAccess } from './user-with-study-access';

export function createStudy(overwrite: Partial<Studie> = {}): Studie {
  return {
    access_level: '',
    description: '',
    has_answers_notify_feature: false,
    has_answers_notify_feature_by_mail: false,
    has_compliance_opposition: false,
    has_four_eyes_opposition: false,
    has_partial_opposition: false,
    has_total_opposition: false,
    hub_email: '',
    name: '',
    pendingStudyChange: undefined,
    pm_email: '',
    status: '',
    ...overwrite,
  };
}

export function createUserWithStudyAccess(
  overwrite: Partial<UserWithStudyAccess> = {}
): UserWithStudyAccess {
  return {
    account_status: undefined,
    compliance_bloodsamples: false,
    compliance_labresults: false,
    compliance_samples: false,
    examination_wave: 0,
    first_logged_in_at: '',
    ids: undefined,
    is_test_proband: false,
    needs_material: false,
    role: undefined,
    studyNamesArray: [],
    study_accesses: [],
    study_center: '',
    study_status: undefined,
    username: '',
    ...overwrite,
  };
}
