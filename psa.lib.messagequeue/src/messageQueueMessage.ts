/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueTopic } from './messageQueueTopics';

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

export interface QuestionnaireInstanceCreatedMessage {
  id: number;
  studyName: string;
  pseudonym: string;
  status: 'inactive' | 'active' | 'expired';
  questionnaire: {
    id: number;
    customName: string;
  };
}

export interface QuestionnaireInstanceActivatedMessage {
  id: number;
  studyName: string;
  pseudonym: string;
  status: 'active';
  questionnaire: {
    id: number;
    customName: string;
  };
}

export interface QuestionnaireInstanceAnsweringStartedMessage {
  id: number;
  studyName: string;
  pseudonym: string;
  status: 'in_progress';
  questionnaire: {
    id: number;
    customName: string;
  };
}

export interface QuestionnaireInstanceReleasedMessage {
  id: number;
  studyName: string;
  pseudonym: string;
  status: 'released_once' | 'released_twice' | 'released';
  releaseVersion: number;
  questionnaire: {
    id: number;
    customName: string;
  };
}

export interface QuestionnaireInstanceExpiredMessage {
  id: number;
  studyName: string;
  pseudonym: string;
  status: 'expired';
  questionnaire: {
    id: number;
    customName: string;
  };
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
  | QuestionnaireInstanceCreatedMessage
  | QuestionnaireInstanceActivatedMessage
  | QuestionnaireInstanceExpiredMessage
  | QuestionnaireInstanceAnsweringStartedMessage
  | QuestionnaireInstanceReleasedMessage
  | FeedbackStatisticConfigurationUpdatedMessage;

export interface MessageTopicMap {
  [MessageQueueTopic.PROBAND_CREATED]: ProbandCreatedMessage;
  [MessageQueueTopic.PROBAND_DELETED]: ProbandDeletedMessage;
  [MessageQueueTopic.PROBAND_DEACTIVATED]: ProbandDeactivatedMessage;
  [MessageQueueTopic.PROBAND_EMAIL_VERIFIED]: ProbandEmailVerifiedMessage;
  [MessageQueueTopic.PROBAND_LOGGED_IN]: ProbandLoggedInMessage;
  [MessageQueueTopic.PROBAND_REGISTERED]: ProbandRegisteredMessage;

  [MessageQueueTopic.COMPLIANCE_CREATED]: ComplianceCreatedMessage;
  [MessageQueueTopic.STUDY_DELETED]: StudyDeletedMessage;

  [MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED]: QuestionnaireInstanceCreatedMessage;
  [MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ACTIVATED]: QuestionnaireInstanceActivatedMessage;
  [MessageQueueTopic.QUESTIONNAIRE_INSTANCE_EXPIRED]: QuestionnaireInstanceExpiredMessage;
  [MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ANSWERING_STARTED]: QuestionnaireInstanceAnsweringStartedMessage;
  [MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED]: QuestionnaireInstanceReleasedMessage;

  [MessageQueueTopic.FEEDBACKSTATISTIC_CONFIGURATION_UPDATED]: FeedbackStatisticConfigurationUpdatedMessage;
  [MessageQueueTopic.FEEDBACKSTATISTIC_OUTDATED]: void;
}
