/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface User {
  id: number;
  username: string;
  password: string;
  token: string;
  token_login: string;
  logged_in_with: string;
  first_logged_in_at: Date | null;
  compliance_labresults: boolean;
  compliance_samples: boolean;
  compliance_bloodsamples: boolean;
  needs_material: boolean;
  pw_change_needed: boolean;
  role: string;
  study_center: string;
  examination_wave: number;
  logging_active: boolean;
  notification_time: string;
  is_test_proband: boolean;
}

export interface StudyUser {
  study_id: string;
  user_id: string;
  access_level: StudyAccessLevel;
}

export type StudyAccessLevel = 'read' | 'write' | 'admin';
