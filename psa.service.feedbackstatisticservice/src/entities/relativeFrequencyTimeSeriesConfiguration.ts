/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { TimeSpanUnit } from '../model/timeSpan';
import { FeedbackStatisticTimeSeries } from './feedbackStatisticTimeSeries';

export class QuestionnaireReference {
  @Column()
  public id!: number;
  @Column()
  public version!: number;
}

export class AnswerOptionValueCodesReference {
  @Column()
  public id!: number;
  @Column('varchar', {
    nullable: true,
  })
  public variableName!: string | null;
  @Column('int', { array: true })
  public valueCodes!: number[];
}

export class ComparativeValues {
  @Column(() => QuestionnaireReference)
  public questionnaire!: QuestionnaireReference;
  @Column(() => AnswerOptionValueCodesReference)
  public answerOptionValueCodes!: AnswerOptionValueCodesReference;
}

export class TimeSpan {
  @Column()
  public amount!: number;
  @Column({
    type: 'enum',
    enum: TimeSpanUnit,
  })
  public unit!: TimeSpanUnit;
}

export class TimeRange {
  @Column()
  public startDate!: Date;
  @Column({ type: 'timestamptz', nullable: true })
  public endDate!: Date | null;
}

@Entity()
export class RelativeFrequencyTimeSeriesConfiguration {
  @PrimaryColumn()
  public id!: number;

  @Column()
  public study!: string;

  @Column(() => ComparativeValues)
  public comparativeValues!: ComparativeValues;

  @OneToMany(
    () => FeedbackStatisticTimeSeries,
    (timeSeries) => timeSeries.relativeFrequencyTimeSeriesConfiguration,
    {
      cascade: ['insert', 'update', 'remove'],
      orphanedRowAction: 'delete',
    }
  )
  public timeSeries!: FeedbackStatisticTimeSeries[];
  @Column(() => TimeSpan)
  public intervalShift!: TimeSpan;
  @Column(() => TimeRange)
  public timeRange!: TimeRange;
}
