/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ResourceID } from './customTypes';
import {
  CustomName,
  DbQuestionnaireForPM,
  Questionnaire,
  QuestionnaireDto,
} from './questionnaire';

/**
 * Identifies a questionnaire instance by either its ID or the custom name
 * of its related questionnaire.
 *
 * A custom name can only be a valid identifier of unique questionnaire instance,
 * when the cycle unit of its related questionnaire is 'once'.
 *
 * @example "456 or asthma_medical_trail"
 */
export type QuestionnaireInstanceIdentifier = ResourceID | CustomName;

/**
 * Defines the current state of a questionnaire instance.
 * `released` is only valid for questionnaires of type `for_study_assistant`.
 * `released_once` and `released_twice` is only valid for questionnaires of type `for_participant`.
 *
 * @example "released"
 */
export type QuestionnaireInstanceStatus =
  | 'inactive'
  | 'active'
  | 'in_progress'
  | 'released'
  | 'released_once'
  | 'released_twice'
  | 'expired'
  | 'deleted';

export interface DbQuestionnaireInstance {
  id: number;
  study_id: string;
  questionnaire_id: number;
  questionnaire_version: number;
  questionnaire_name: string;
  user_id: string | null;
  date_of_issue: Date;
  date_of_release_v1: Date | null;
  date_of_release_v2: Date | null;
  cycle: number;
  status: QuestionnaireInstanceStatus;
  notifications_scheduled: boolean | null;
  progress: number | null;
  release_version: number | null;
}

export interface QuestionnaireInstance extends DbQuestionnaireInstance {
  questionnaire: Questionnaire;
}

export interface QuestionnaireInstanceForPM extends DbQuestionnaireInstance {
  questionnaire: DbQuestionnaireForPM | undefined;
}

export interface QuestionnaireInstanceDto {
  /** @isInt **/
  id: number;
  studyId: string | null;
  questionnaireName: string;
  pseudonym: string | null;
  dateOfIssue: Date;
  dateOfReleaseV1: Date | null;
  dateOfReleaseV2: Date | null;
  /** @isInt **/
  cycle: number;
  status: QuestionnaireInstanceStatus;
  notificationsScheduled: boolean | null;
  /**
   * Current progress in percent. Ranges from 0 to 100.
   * @isInt
   * @example "49"
   */
  progress: number | null;
  /**
   * Version counter, increasing with each release.
   * @isInt
   * @example "1"
   */
  releaseVersion: number | null;
  questionnaire?: QuestionnaireDto;
}

export type PatchQuestionnaireInstanceDto = Partial<
  Pick<QuestionnaireInstanceDto, 'status' | 'progress' | 'releaseVersion'>
>;
