/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import {
  AnswerOptionValueCodesReference,
  QuestionnaireReference,
  RelativeFrequencyTimeSeriesConfiguration,
} from './relativeFrequencyTimeSeriesConfiguration';

@Entity()
export class FeedbackStatisticTimeSeries {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public study!: string;

  @Column()
  public color!: string; // hex code
  @Column()
  public label!: string;

  @Column(() => QuestionnaireReference)
  public questionnaire!: QuestionnaireReference;

  @Column(() => AnswerOptionValueCodesReference)
  public answerOptionValueCodes!: AnswerOptionValueCodesReference;

  @Column()
  public relativeFrequencyTimeSeriesConfigurationId!: number;

  @ManyToOne(
    () => RelativeFrequencyTimeSeriesConfiguration,
    (config) => config.timeSeries,
    {
      primary: true,
      orphanedRowAction: 'delete',
    }
  )
  public relativeFrequencyTimeSeriesConfiguration?: RelativeFrequencyTimeSeriesConfiguration;
}
