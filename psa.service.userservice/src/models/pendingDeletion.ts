/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface PendingDeletionRequest {
  requested_by: string;
  requested_for: string; // email
  type: PendingDeletionType;
  for_id: string;
}
export type PendingDeletionType = 'proband' | 'study' | 'sample';

interface PendingDeletionBase {
  id: number;
  requested_by: string;
  requested_for: string; // email
  type: PendingDeletionType;
  for_id: string;
}

export interface PendingProbandDeletionDto extends PendingDeletionBase {
  type: 'proband';
}

export interface PendingSampleDeletionDto extends PendingDeletionBase {
  type: 'sample';
}

export interface PendingStudyDeletionDto extends PendingDeletionBase {
  type: 'study';
}

export type PendingDeletionDto =
  | PendingProbandDeletionDto
  | PendingSampleDeletionDto
  | PendingStudyDeletionDto;
