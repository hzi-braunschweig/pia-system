/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeedbackStatisticType } from './specificFeedbackStatistics';

export enum FeedbackStatisticVisibility {
  HIDDEN = 'hidden',
  TESTPROBANDS = 'testprobands',
  ALLAUDIENCES = 'allaudiences',
}

@Entity()
export class FeedbackStatisticConfiguration {
  @PrimaryGeneratedColumn()
  public id!: number;
  @Column()
  public study!: string;
  @Column({
    type: 'enum',
    enum: FeedbackStatisticVisibility,
  })
  public visibility!: FeedbackStatisticVisibility;
  @Column()
  public title!: string;
  @Column()
  public description!: string;
  @Column({
    type: 'enum',
    enum: FeedbackStatisticType,
  })
  public type!: FeedbackStatisticType;
  @CreateDateColumn()
  public createdAt!: Date;
  @UpdateDateColumn()
  public updatedAt!: Date;
}
