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
  study: string;
  firstLoggedInAt: string | null;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  complianceContact: boolean;
  accountStatus: AccountStatus;
  status: ProbandStatus;
  ids: string | null;
  isTestProband: boolean;
}

export type ProbandRequestInternalDto = Omit<
  ProbandResponseInternalDto,
  'pseudonym' | 'password' | 'study'
>;

export enum ProbandOrigin {
  SELF = 'self', // created on probands own accord
  INVESTIGATOR = 'investigator', // created by an investigator
  SORMAS = 'sormas', // created by sormas
}

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
  origin: ProbandOrigin;
}

export interface ProbandExternalIdResponseInternalDto {
  pseudonym: string;
  externalId: string;
}
