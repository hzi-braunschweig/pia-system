/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export type PendingDeletionType = 'proband' | 'study' | 'sample';

interface PendingDeletionBase {
  id: number;
  requested_by: string;
  requested_for: string;
  type: PendingDeletionType;
  for_id: string;
}

export interface PendingProbandDeletion extends PendingDeletionBase {
  type: 'proband';
}

export interface PendingSampleDeletion extends PendingDeletionBase {
  type: 'sample';
}

export interface PendingStudyDeletion extends PendingDeletionBase {
  type: 'study';
}

export type PendingDeletion =
  | PendingProbandDeletion
  | PendingSampleDeletion
  | PendingStudyDeletion;
