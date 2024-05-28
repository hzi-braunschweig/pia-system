/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export enum LabResultStatus {
  New = 'new',
  Analyzed = 'analyzed',
  Inactive = 'inactive',
}

export enum LabResultStudyStatus {
  Active = 'active',
  Deactivated = 'deactivated',
  DeletionPending = 'deletion_pending',
  Deleted = 'deleted',
}

export interface LabResultInternalDto {
  id: string;
  dummyId: string;
  pseudonym: string;
  dateOfSampling: Date | null;
  remark: string | null;
  status: LabResultStatus;
  newSamplesSent: boolean | null;
  performingDoctor: string | null;
  studyStatus: LabResultStudyStatus;
}
