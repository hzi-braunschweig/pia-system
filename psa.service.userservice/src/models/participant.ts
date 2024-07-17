/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Pseudonym } from '@pia/lib-publicapi';
import { AccountStatus } from './accountStatus';

/**
 * The participant's status within the study
 */
export enum ParticipantStatus {
  /**
   * The participant is active in the study and
   * can answer questionnaires
   */
  ACTIVE = 'active',
  /**
   * The participant is inactive in the study and
   * cannot answer questionnaires
   */
  DEACTIVATED = 'deactivated',
  /**
   * The participant and all his data is deleted
   */
  DELETED = 'deleted',
}

/**
 * A participant of a study
 */
export interface ParticipantDto {
  pseudonym: Pseudonym;
  /**
   * Optional external ids of the participant
   */
  ids: string | null;
  /**
   * The name of the study the participant belongs to
   */
  study: string;
  status: ParticipantStatus;
  accountStatus: AccountStatus;
  /**
   * The optional name of the study center
   * where the participant is examined.
   * Only used for documentation reasons
   */
  studyCenter: string | null;
  /**
   * The optional examination wave in which the
   * participant participates.
   * Only used for documentation reasons
   *
   * @isInt
   */
  examinationWave: number | null;
  /**
   * The optional flag that indicates if the participant
   * is a test participant and not a real participant.
   */
  isTestParticipant: boolean;
  /**
   * @isDateTime
   */
  firstLoggedInAt: Date | null;
  /**
   * @isDateTime
   */
  deactivatedAt: Date;
  /**
   * @isDateTime
   */
  deletedAt: Date;
}

export type CreateParticipantRequestDto = Partial<
  Pick<
    ParticipantDto,
    | 'pseudonym'
    | 'ids'
    | 'studyCenter'
    | 'examinationWave'
    | 'isTestParticipant'
  >
>;

export type CreateParticipantResponseDto = Pick<ParticipantDto, 'pseudonym'> & {
  password: string;
};

export type PatchParticipantRequestDto = Partial<
  Pick<
    ParticipantDto,
    'ids' | 'studyCenter' | 'examinationWave' | 'isTestParticipant'
  >
>;

/**
 * The type of deletion of a participant
 */
export enum ParticipantDeletionType {
  /**
   * Delete all proband data but keep the pseudonym with the deleted flag
   */
  DEFAULT = 'default',
  /**
   * Fully delete all proband data
   */
  FULL = 'full',
}
