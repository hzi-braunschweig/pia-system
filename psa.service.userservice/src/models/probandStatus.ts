/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * The participant's status within the study
 */
export enum ProbandStatus {
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
