/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type AccessLevel = 'read' | 'write' | 'admin';

export interface StudyAccess {
  study_id: string;
  user_id: string;
  access_level: AccessLevel;
}

export type StudyAccessOfUser = Omit<StudyAccess, 'user_id'>;
