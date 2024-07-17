/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Proband } from '../entities/proband';
import { ExternalCompliance } from './externalCompliance';
import { AccountStatus } from './accountStatus';
import { ProbandStatus } from './probandStatus';
import { PersonalDataInternalDtoGet } from '@pia-system/lib-http-clients-internal';

// Create Proband

export interface CreateIDSProbandRequest {
  ids: string;
}

export enum ProbandOrigin {
  SELF = 'self', // created on probands own accord
  INVESTIGATOR = 'investigator', // created by an investigator
  SORMAS = 'sormas', // created by sormas
  PUBLIC_API = 'public_api', // created via public api
}

export interface CreateProbandRequest {
  pseudonym?: string;
  ids?: string | null;
  complianceLabresults?: boolean;
  complianceSamples?: boolean;
  complianceBloodsamples?: boolean;
  studyCenter?: string | null;
  examinationWave?: number | null;
  temporaryPassword?: boolean;
  origin: ProbandOrigin;
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
export type ProbandDataPatch = Partial<
  Pick<ProbandDto, 'ids' | 'studyCenter' | 'examinationWave' | 'isTestProband'>
>;
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

export type ProbandDataForExportDto = ProbandDto &
  Partial<PersonalDataInternalDtoGet> &
  Partial<{
    pending_compliance_change_labresults_to: boolean;
    pending_compliance_change_samples_to: boolean;
    pending_compliance_change_bloodsamples_to: boolean;
    pending_personal_data_deletion: boolean;
    pending_proband_deletion: boolean;
  }>;
