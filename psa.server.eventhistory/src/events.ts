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
  QuestionnaireInstanceCreatedMessage,
  QuestionnaireInstanceActivatedMessage,
  QuestionnaireInstanceAnsweringStartedMessage,
  QuestionnaireInstanceExpiredMessage,
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
  MessageQueueTopic.QUESTIONNAIRE_INSTANCE_CREATED,
  MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ACTIVATED,
  MessageQueueTopic.QUESTIONNAIRE_INSTANCE_ANSWERING_STARTED,
  MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED,
  MessageQueueTopic.QUESTIONNAIRE_INSTANCE_EXPIRED,
] as const;

export type EventType = typeof SupportedTopics[number];

/**
 * Event types:
 * - `proband.created` - proband was created
 * - `proband.deleted` - proband's data was deleted
 * - `proband.deactivated` - proband was deactivated and should not receive any new questionnaires
 * - `proband.logged_in` - proband logged in
 * - `proband.email_verified` - proband successfully verified their email after registration
 * - `compliance.created` - compliance was filled out by proband
 * - `questionnaire_instance.created` - questionnaire instance was created
 * - `questionnaire_instance.activated` - questionnaire instance was activated
 * - `questionnaire_instance.answering_started` - questionnaire instance was started to be answered
 * - `questionnaire_instance.released` - questionnaire instance moved to any "released*" status
 * - `questionnaire_instance.expired` - questionnaire instance has expired
 */
export type EventTypeString = `${typeof SupportedTopics[number]}`;

export type SupportedMessages =
  | ProbandLoggedInMessage
  | ProbandCreatedMessage
  | ProbandDeletedMessage
  | ProbandDeactivatedMessage
  | ProbandEmailVerifiedMessage
  | ComplianceCreatedMessage
  | QuestionnaireInstanceCreatedMessage
  | QuestionnaireInstanceActivatedMessage
  | QuestionnaireInstanceAnsweringStartedMessage
  | QuestionnaireInstanceReleasedMessage
  | QuestionnaireInstanceExpiredMessage;
