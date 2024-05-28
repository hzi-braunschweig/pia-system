/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ProbandCreatedMessage {
  pseudonym: string;
  studyName: string;
}

export interface ProbandDeletedMessage {
  pseudonym: string;
  studyName: string;
  deletionType:
    | 'default' // delete all proband data but keep the pseudonym
    | 'keep_usage_data' // delete all proband data but keep usage data like logs and the pseudonym
    | 'full'; // fully delete all proband data
}

export interface ProbandDeactivatedMessage {
  pseudonym: string;
  studyName: string;
}

export interface ProbandEmailVerifiedMessage {
  pseudonym: string;
  studyName: string;
}

export interface ProbandLoggedInMessage {
  pseudonym: string;
  studyName: string;
}

export interface ComplianceCreatedMessage {
  pseudonym: string;
  studyName: string;
}

export interface ProbandRegisteredMessage {
  username: string;
  studyName: string;
}

export interface StudyDeletedMessage {
  studyName: string;
}

export interface QuestionnaireInstanceReleasedMessage {
  id: number;
  releaseVersion: number;
  studyName: string;
}

export interface FeedbackStatisticConfigurationUpdatedMessage {
  configurationId: number;
}

export type MessageQueueMessage =
  | ProbandCreatedMessage
  | ProbandDeletedMessage
  | ProbandDeactivatedMessage
  | ProbandEmailVerifiedMessage
  | ProbandLoggedInMessage
  | ProbandRegisteredMessage
  | ComplianceCreatedMessage
  | StudyDeletedMessage
  | QuestionnaireInstanceReleasedMessage
  | FeedbackStatisticConfigurationUpdatedMessage;
