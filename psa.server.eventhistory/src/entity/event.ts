/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { EventType, SupportedMessages } from '../events';

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column({ type: 'varchar' })
  public type!: EventType;

  @Column()
  public studyName!: string;

  @Column({ type: 'jsonb' })
  public payload!: Omit<SupportedMessages, 'studyName'>;

  @Column({ type: 'timestamp' })
  public timestamp!: Date;
}
