/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type AccountStatus =
  | 'active'
  | 'deactivated'
  | 'deactivation_pending'
  | 'no_account';

export interface User {
  account_status: AccountStatus;
}

export interface StudyAccess {
  study_id: string;
  user_id: string;
  access_level: StudyAccessLevel;
}

export type StudyAccessLevel = 'read' | 'write' | 'admin';
