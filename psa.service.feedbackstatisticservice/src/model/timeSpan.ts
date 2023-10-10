/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { addDays, addHours, addMonths, addWeeks } from 'date-fns';
import { UnreachableCaseError } from 'ts-essentials';
import { TimeRange } from './timeRange';
import { TimeSpan as TimeSpanEntity } from '../entities/relativeFrequencyTimeSeriesConfiguration';

export enum TimeSpanUnit {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export interface TimeSpanDto {
  amount: number;
  unit: TimeSpanUnit;
}

export class TimeSpan {
  public constructor(
    public readonly amount: number,
    public readonly unit: TimeSpanUnit
  ) {}

  public static convertTimeSpanUnit(
    unit: 'hour' | 'day' | 'week' | 'month'
  ): TimeSpanUnit {
    switch (unit) {
      case 'hour':
        return TimeSpanUnit.HOUR;
      case 'day':
        return TimeSpanUnit.DAY;
      case 'week':
        return TimeSpanUnit.WEEK;
      case 'month':
        return TimeSpanUnit.MONTH;
      default:
        throw new UnreachableCaseError(unit);
    }
  }

  public static fromEntity(entity: TimeSpanEntity): TimeSpan {
    return new TimeSpan(
      entity.amount,
      TimeSpan.convertTimeSpanUnit(entity.unit)
    );
  }

  public static fromJson(timeSpan: TimeSpanDto): TimeSpan {
    return new TimeSpan(timeSpan.amount, timeSpan.unit);
  }

  public invert(): TimeSpan {
    return new TimeSpan(-this.amount, this.unit);
  }

  public shiftDate(date: Date): Date {
    switch (this.unit) {
      case TimeSpanUnit.HOUR:
        return addHours(date, this.amount);
      case TimeSpanUnit.DAY:
        return addDays(date, this.amount);
      case TimeSpanUnit.WEEK:
        return addWeeks(date, this.amount);
      case TimeSpanUnit.MONTH:
        return addMonths(date, this.amount);
      default:
        return date;
    }
  }

  public shiftTimeRange(timeRange: TimeRange): TimeRange {
    return new TimeRange(
      this.shiftDate(timeRange.startDate),
      timeRange.endDate ? this.shiftDate(timeRange.endDate) : null
    );
  }
}
