/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type ProbandStatus = 'active' | 'deactivated' | 'deleted';

export interface User {
  status: ProbandStatus;
}

export interface StudyAccess {
  study_id: string;
  user_id: string;
  access_level: StudyAccessLevel;
}

export type StudyAccessLevel = 'read' | 'write' | 'admin';
