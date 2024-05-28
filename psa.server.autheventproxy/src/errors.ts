/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MessageQueueTopic } from '@pia/lib-messagequeue';

export class ProxyOnMessageError extends Error {
  public constructor(
    public readonly pattern: string,
    public readonly topic: MessageQueueTopic,
    public readonly prototype: Error
  ) {
    super(`Event Error | ${pattern} > ${topic} | ${prototype.message}`);
  }
}

export class PseudonymInKeycloakEventNotFound extends Error {}

export class StudyOfParticipantNotFound extends Error {
  public constructor(public readonly pseudonym: string) {
    super(`Study of participant not found: ${pseudonym}`);
  }
}
