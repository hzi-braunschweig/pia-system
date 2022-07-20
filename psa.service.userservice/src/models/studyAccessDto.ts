/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type StudyAccessLevel = 'read' | 'write' | 'admin';

export interface StudyAccessDto {
  studyName: string;
  username: string;
  accessLevel: StudyAccessLevel;
}