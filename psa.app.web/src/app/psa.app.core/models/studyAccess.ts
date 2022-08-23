/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type AccessLevel = 'read' | 'write' | 'admin';

export interface StudyAccess {
  studyName: string;
  username: string;
  accessLevel: AccessLevel;
}

export type StudyAccessOfUser = {
  study_id: string;
  access_level: AccessLevel;
};

/**
 * The studies to which a planned proband is visible
 */
export interface PlannedProbandStudyAccess {
  study_id: string;
  user_id: string;
  access_level: AccessLevel;
}
