/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Proband } from '../entities/proband';
import { ExternalCompliance } from './externalCompliance';
import { AccountStatus } from './accountStatus';
import { ProbandStatus } from './probandStatus';

// Create Proband

export interface CreateIDSProbandRequest {
  ids: string;
}

export interface CreateProbandRequest {
  pseudonym: string;
  ids?: string;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  studyCenter?: string;
  examinationWave?: number;
}

export interface CreateProbandResponse {
  pseudonym: string;
  password: string;
}

export interface CreateProbandExternalResponse {
  pseudonym: string;
  resultURL: URL;
}

export enum CreateProbandError {
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  NO_ACCESS_TO_STUDY = 'NO_ACCESS_TO_STUDY',
  NO_PLANNED_PROBAND_FOUND = 'NO_PLANNED_PROBAND_FOUND',
  PROBAND_ALREADY_EXISTS = 'PROBAND_ALREADY_EXISTS',
  CREATING_ACCOUNG_FAILED = 'CREATING_ACCOUNG_FAILED',
  SAVING_PROBAND_FAILED = 'SAVING_PROBAND_FAILED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Get Proband

export interface ProbandResponse extends ExternalCompliance {
  pseudonym: string;
  first_logged_in_at: Date | null;
  study: string;
  accountStatus: AccountStatus;
  status: ProbandStatus;
  ids: string | null;
  needs_material: boolean;
  study_center: string | null;
  examination_wave: number | null;
  is_test_proband: boolean;
}

export interface ProbandResponseNew extends ExternalCompliance {
  pseudonym: string;
  firstLggedInAt: Date | null;
  study: string;
  accountStatus: AccountStatus;
  status: ProbandStatus;
  ids: string | null;
  needsMaterial: boolean;
  studyCenter: string | null;
  examinationWave: number | null;
  isTestProband: boolean;
}

// Patch Proband

export type ProbandComplianceContactPatch = Pick<Proband, 'complianceContact'>;
export type ProbandStatusPatch = Pick<Proband, 'status'>;
export type ProbandPatch = ProbandComplianceContactPatch | ProbandStatusPatch;
export function isProbandComplianceContactPatch(
  check: ProbandPatch
): check is ProbandComplianceContactPatch {
  const patch = check as Partial<ProbandComplianceContactPatch>;
  return (
    typeof check === 'object' && typeof patch.complianceContact === 'boolean'
  );
}
export function isProbandStatusPatch(
  check: ProbandPatch
): check is ProbandStatusPatch {
  const patch = check as Partial<ProbandStatusPatch>;
  return typeof check === 'object' && typeof patch.status === 'string';
}
