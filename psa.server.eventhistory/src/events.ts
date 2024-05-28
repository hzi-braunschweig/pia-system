/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  MessageQueueTopic,
  ProbandCreatedMessage,
  ProbandDeletedMessage,
  ProbandDeactivatedMessage,
  ProbandEmailVerifiedMessage,
  ComplianceCreatedMessage,
  QuestionnaireInstanceReleasedMessage,
  ProbandLoggedInMessage,
} from '@pia/lib-messagequeue';

/**
 * For detailed infos and more topics see
 * @see MessageQueueTopic
 */
export const SupportedTopics = [
  MessageQueueTopic.PROBAND_LOGGED_IN,
  MessageQueueTopic.PROBAND_CREATED,
  MessageQueueTopic.PROBAND_DELETED,
  MessageQueueTopic.PROBAND_DEACTIVATED,
  MessageQueueTopic.PROBAND_EMAIL_VERIFIED,
  MessageQueueTopic.COMPLIANCE_CREATED,
  MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
] as const;

export type EventType = typeof SupportedTopics[number];
export type EventTypeString = `${typeof SupportedTopics[number]}`;

export type SupportedMessages =
  | ProbandLoggedInMessage
  | ProbandCreatedMessage
  | ProbandDeletedMessage
  | ProbandDeactivatedMessage
  | ProbandEmailVerifiedMessage
  | ComplianceCreatedMessage
  | QuestionnaireInstanceReleasedMessage;
