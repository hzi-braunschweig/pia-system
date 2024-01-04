/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TimeRange } from '../model/timeRange';
import { endOfDay, isAfter, isBefore } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import {
  RelativeFrequencyTimeSeriesDataDto,
  TimeSeriesIntervalDataDto,
} from '../model/relativeFrequencyTimeSeriesDto';
import {
  AnswerOptionValueCodesReference,
  RelativeFrequencyTimeSeriesConfiguration,
} from '../entities/relativeFrequencyTimeSeriesConfiguration';
import { IssueDatesCalculator } from './issueDatesCalculator';
import { TimeSpan } from '../model/timeSpan';

export interface AnswerData {
  questionnaireId: number;
  questionnaireInstanceId: number;
  questionnaireInstanceDateOfIssue: Date;
  answerOptionId: number;
  valueCodes: number[];
}

export type GivenAnswers = AnswerData;

export interface QuestionnaireSettings {
  id: number;
  cycleAmount: number | null;
  cycleUnit: 'once' | 'day' | 'week' | 'month' | 'hour' | 'spontan' | null;
  cyclePerDay: number | null;
  cycleFirstHour: number | null;
  activateAfterDays: number;
  deactivateAfterDays: number;
  notificationWeekday: Weekday | null;
  createdAt: Date | null;
}

export type Weekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export class RelativeFrequencyTimeSeries {
  private static readonly JITTER_LOWER_BOUND = -3;
  private static readonly JITTER_UPPER_BOUND = 3;
  private static readonly MIN_VALUE = 0;
  private static readonly MAX_VALUE = 100;
  private readonly startDate: Date = this.config.timeRange.startDate;
  private readonly endDate: Date = endOfDay(
    this.config.timeRange.endDate ?? new Date()
  );
  private readonly intervalLength: TimeSpan = this.getIntervalLength();
  private readonly intervalShift = TimeSpan.fromEntity(
    this.config.intervalShift
  );
  private readonly timeSeriesData: Map<string, GivenAnswers[]> =
    this.initializeTimeSeriesIntervals();

  public constructor(
    private readonly config: RelativeFrequencyTimeSeriesConfiguration,
    private readonly questionnaire: QuestionnaireSettings,
    private readonly firstQuestionnaireVersionCreatedAt: Date | null
  ) {}

  public getData(): RelativeFrequencyTimeSeriesDataDto[] {
    return this.config.timeSeries.map((timeSeries) => {
      return {
        color: timeSeries.color,
        label: timeSeries.label,
        intervals: this.getIntervalData(timeSeries.answerOptionValueCodes),
      };
    });
  }

  public isEmpty(): boolean {
    return this.getData().every((timeSeries) =>
      timeSeries.intervals.every((interval) => interval.value === 0)
    );
  }

  public pushAnswer(answer: AnswerData): void {
    const intervalKey = this.getIntervalKeyForDateOfIssue(
      utcToZonedTime(answer.questionnaireInstanceDateOfIssue, 'Europe/Berlin')
    );

    if (!this.timeSeriesData.has(intervalKey)) {
      console.error(
        'Answer for interval out of time series range: ' + intervalKey
      );

      return;
    }

    const intervalData = this.timeSeriesData.get(intervalKey) ?? [];
    intervalData.push(answer);
    this.timeSeriesData.set(intervalKey, intervalData);
  }

  private getIntervalLength(): TimeSpan {
    if (
      !this.questionnaire.cycleAmount ||
      !this.questionnaire.cycleUnit ||
      this.questionnaire.cycleUnit === 'once' ||
      this.questionnaire.cycleUnit === 'spontan'
    ) {
      throw new Error('Invalid cycle for relative frequency time series');
    }
    return new TimeSpan(
      this.questionnaire.cycleAmount,
      TimeSpan.convertTimeSpanUnit(this.questionnaire.cycleUnit)
    );
  }

  private initializeTimeSeriesIntervals(): Map<string, GivenAnswers[]> {
    return new Map<string, GivenAnswers[]>(
      IssueDatesCalculator.getFromQuestionnaireSettings(
        this.questionnaire,
        this.firstQuestionnaireVersionCreatedAt
      )
        .map((dateOfIssue) => this.intervalShift.shiftDate(dateOfIssue))
        .map(
          (intervalStartDate) =>
            new TimeRange(
              intervalStartDate,
              this.intervalLength.shiftDate(intervalStartDate)
            )
        )
        .filter((interval) => isAfter(interval.startDate, this.startDate))
        .filter(
          (interval) =>
            interval.endDate !== null &&
            isBefore(interval.endDate, this.endDate)
        )
        .map((interval) => [interval.toISOString(), []])
    );
  }

  private getIntervalKeyForDateOfIssue(
    questionnaireInstanceDateOfIssue: Date
  ): string {
    return this.intervalShift
      .shiftTimeRange(
        new TimeRange(
          questionnaireInstanceDateOfIssue,
          this.intervalLength.shiftDate(questionnaireInstanceDateOfIssue)
        )
      )
      .toISOString();
  }

  private getIntervalData(
    answerOptionValueCodes: AnswerOptionValueCodesReference
  ): TimeSeriesIntervalDataDto[] {
    return Array.from(this.timeSeriesData.entries()).map(
      ([intervalKey, answers]) => ({
        timeRange: TimeRange.fromISOString(intervalKey),
        value: this.calculateRelativeFrequency(answerOptionValueCodes, answers),
      })
    );
  }

  private calculateRelativeFrequency(
    numerator: AnswerOptionValueCodesReference,
    givenAnswersOfInterval: GivenAnswers[]
  ): number {
    if (givenAnswersOfInterval.length === 0) {
      return 0;
    }

    const MULTIPLIER = 100;

    const denominator = this.config.comparativeValues.answerOptionValueCodes;
    const codesNumerator = numerator.valueCodes;
    const codesDenominator = denominator.valueCodes;

    const relativeFrequency =
      givenAnswersOfInterval.filter(
        (answer) =>
          answer.answerOptionId === numerator.id &&
          codesNumerator.some((code) => answer.valueCodes.includes(code))
      ).length /
      givenAnswersOfInterval.filter(
        (answer) =>
          answer.answerOptionId === denominator.id &&
          codesDenominator.some((code) => answer.valueCodes.includes(code))
      ).length;

    return this.limitToRange(
      Math.round(
        (relativeFrequency * MULTIPLIER || 0) +
          this.getRandomNumber(
            RelativeFrequencyTimeSeries.JITTER_LOWER_BOUND,
            RelativeFrequencyTimeSeries.JITTER_UPPER_BOUND
          )
      ),
      RelativeFrequencyTimeSeries.MIN_VALUE,
      RelativeFrequencyTimeSeries.MAX_VALUE
    );
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private limitToRange(value: number, min: number, max: number): number {
    return Math.max(Math.min(value, max), min);
  }
}
