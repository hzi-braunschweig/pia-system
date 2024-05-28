/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EventType } from '../events';
import { MessageQueueTopic } from '@pia/lib-messagequeue';
import { Pseudonym } from '@pia/lib-publicapi';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar' })
  public type!: EventType;

  @Column()
  public studyName!: string;

  @Column({ type: 'jsonb' })
  public payload!: Record<string, unknown>;

  @Column({ type: 'timestamp' })
  public timestamp!: Date;
}

export class ProbandLoggedInEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.PROBAND_LOGGED_IN;

  @Column({ type: 'jsonb' })
  public payload!: {
    pseudonym: Pseudonym;
  };
}

export class ProbandCreatedEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.PROBAND_CREATED;

  @Column({ type: 'jsonb' })
  public payload!: {
    pseudonym: Pseudonym;
  };
}

export class ProbandDeletedEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.PROBAND_DELETED;

  @Column({ type: 'jsonb' })
  public payload!: {
    pseudonym: Pseudonym;
  };
}

export class ProbandDeactivatedEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.PROBAND_DELETED;

  @Column({ type: 'jsonb' })
  public payload!: {
    pseudonym: Pseudonym;
  };
}

export class ProbandEmailVerifiedEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.PROBAND_EMAIL_VERIFIED;

  @Column({ type: 'jsonb' })
  public payload!: {
    pseudonym: Pseudonym;
  };
}

export class ComplianceCreatedEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.COMPLIANCE_CREATED;

  @Column({ type: 'jsonb' })
  public payload!: {
    pseudonym: Pseudonym;
  };
}

export class QuestionnaireInstanceReleasedEvent extends Event {
  @Column({ type: 'varchar' })
  public type!: MessageQueueTopic.QUESTIONNAIRE_INSTANCE_RELEASED;

  @Column({ type: 'jsonb' })
  public payload!: {
    id: number;
    releaseVersion: number;
  };
}

export type EventEntity =
  | ProbandLoggedInEvent
  | ProbandCreatedEvent
  | ProbandDeletedEvent
  | ProbandDeactivatedEvent
  | ProbandEmailVerifiedEvent
  | ComplianceCreatedEvent
  | QuestionnaireInstanceReleasedEvent;
