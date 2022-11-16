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
  pseudonym?: string;
  ids?: string;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  studyCenter?: string;
  examinationWave?: number;
  temporaryPassword?: boolean;
  origin: string;
}

export interface CreateProbandResponse {
  pseudonym: string;
  password: string;
}

export interface ProbandDto extends ExternalCompliance {
  pseudonym: string;
  ids: string | null;
  study: string;
  status: ProbandStatus;
  accountStatus: AccountStatus;
  needsMaterial: boolean | null;
  studyCenter: string | null;
  examinationWave: number | null;
  firstLoggedInAt: Date | null;
  isTestProband: boolean;
  deactivatedAt: Date;
  deletedAt: Date;
}

export interface ProbandExternalIdResponse {
  pseudonym: string;
  externalId: string;
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
