/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @deprecated Use {@link PlannedProband} entity instead
 */
export interface PlannedProbandDeprecated {
  user_id: string;
  password: string;
  activated_at: Date;
  study_accesses: PlannedProbandStudyAccessDeprecated;
}

/**
 * @deprecated Use {@link PlannedProband} entity instead
 */
export interface PlannedProbandStudyAccessDeprecated {
  study_id: string;
  user_id: string;
}
