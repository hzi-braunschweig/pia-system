/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface MessagePayloadProbandDeleted {
  pseudonym: string;
}

export interface MessagePayloadComplianceCreated {
  pseudonym: string;
}

export interface MessagePayloadQuestionnaireInstanceReleased {
  id: number;
  releaseVersion: number;
}
