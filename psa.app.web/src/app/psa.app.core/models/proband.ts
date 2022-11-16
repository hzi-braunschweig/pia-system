/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ExternalCompliance } from './externalCompliance';

/**
 * This will be the new interface when multiple studies per user are removed
 * or the probands are queried by study
 */
export interface Proband extends ExternalCompliance {
  pseudonym: string;
  study: string;
  accountStatus: AccountStatus;
  status: ProbandStatus;
  ids: string | null;
  studyCenter: string | null;
  needsMaterial: boolean | null;
  examinationWave: number | null;
  isTestProband: boolean;
  firstLoggedInAt: Date | null;
  deactivatedAt: string;
  deletedAt: string;
  createdAt: Date | null;
  origin: string;
}

export type AccountStatus = 'account' | 'no_account';
export type ProbandStatus = 'active' | 'deactivated' | 'deleted';

export enum ProbandOrigin {
  SELF = 'self',
  INVESTIGATOR = 'investigator',
  SORMAS = 'sormas',
}

export interface CreateProbandRequest {
  pseudonym: string;
  ids?: string;
  complianceLabresults: boolean;
  complianceSamples: boolean;
  complianceBloodsamples: boolean;
  studyCenter: string;
  examinationWave: number;
  origin: ProbandOrigin;
}

export interface CreateIDSProbandRequest {
  ids: string;
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
