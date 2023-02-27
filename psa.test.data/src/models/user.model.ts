/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type Realm = 'admin' | 'proband' | 'master';

export interface UserCredentials {
  username: string;
  password: string;
  realm: Realm;
}

export type AuthToken = string;

export type StudyAccessLevel = 'read' | 'write' | 'admin';
export type ProfessionalRole =
  | 'Forscher'
  | 'ProbandenManager'
  | 'EinwilligungsManager'
  | 'Untersuchungsteam';

export interface StudyAccess {
  study_id: string;
  access_level: StudyAccessLevel;
}

export interface ProfessionalUser {
  username: string;
  role: ProfessionalRole;
  study_accesses?: StudyAccess[];
  compliance_labresults?: boolean;
}

export interface Proband {
  pseudonym: string;
  origin: string;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  studyCenter: string;
  examinationWave: number;
  ids?: string;
}
