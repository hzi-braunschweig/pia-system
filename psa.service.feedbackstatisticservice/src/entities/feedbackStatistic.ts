/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { SpecificFeedbackStatistic } from './specificFeedbackStatistics';
import { FeedbackStatisticConfiguration } from './feedbackStatisticConfiguration';

export type FeedbackStatisticData = SpecificFeedbackStatistic['data'];

export enum FeedbackStatisticStatus {
  HAS_DATA = 'has_data',
  PENDING = 'pending',
  INSUFFICIENT_DATA = 'insufficient_data',
  ERROR = 'error',
}

@Entity()
export class FeedbackStatistic implements SpecificFeedbackStatistic {
  @PrimaryColumn()
  public configurationId!: number;

  @OneToOne(() => FeedbackStatisticConfiguration, (config) => config.id)
  @JoinColumn()
  public configuration!: FeedbackStatisticConfiguration;

  @Column()
  public study!: string;

  @Column()
  public status!: FeedbackStatisticStatus;

  @Column({
    type: 'simple-json',
    nullable: true,
  })
  public data!: FeedbackStatisticData | null;

  @Column({ type: 'timestamptz', nullable: true })
  public updatedAt!: Date | null;
}
