/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum AccountStatus {
  ACCOUNT = 'account',
  NO_ACCOUNT = 'no_account',
}
export enum ProbandStatus {
  ACTIVE = 'active',
  DEACTIVATED = 'deactivated',
  DELETED = 'deleted',
}
export interface StudyAccess {
  study_id: string;
  access_level: AccessLevel;
}
export type AccessLevel = 'read' | 'write' | 'admin';

export interface ProbandInternalDto {
  pseudonym: string;
  role: 'Proband';
  study: string;
  first_logged_in_at: string | null;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  complianceContact: boolean;
  accountStatus: AccountStatus;
  status: ProbandStatus;
  ids: string | null;
  /**
   * @deprecated use {@link ProbandInternalDto#study} instead
   */
  study_accesses: StudyAccess[];
}

export type ProbandRequestInternalDto = Omit<
  ProbandResponseInternalDto,
  'password' | 'study'
>;

export interface ProbandResponseInternalDto {
  pseudonym: string;
  password: string;
  study: string;
  ids: string | null;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  studyCenter: string | null;
  examinationWave: number;
}
