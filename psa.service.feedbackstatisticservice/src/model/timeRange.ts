/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TimeRange as TimeRangeEntity } from '../entities/relativeFrequencyTimeSeriesConfiguration';

export interface TimeRangeDto {
  startDate: string; // ISO date string
  endDate: string | null; // ISO date string, null = now
}

export class TimeRange {
  public constructor(
    public readonly startDate: Date,
    public readonly endDate: Date | null = null // null = now
  ) {}

  public static fromEntity(entity: TimeRangeEntity): TimeRange {
    return new TimeRange(entity.startDate, entity.endDate);
  }

  public static fromISOString(timeRange: string): TimeRange {
    const [startDate, endDate] = timeRange.split('/');
    if (!startDate) {
      throw new Error('Invalid time range: ' + timeRange);
    }
    return new TimeRange(
      new Date(startDate),
      endDate ? new Date(endDate) : null
    );
  }

  public toISOString(): string {
    return `${this.startDate.toISOString()}${
      this.endDate ? '/' + this.endDate.toISOString() : ''
    }`;
  }

  public isEqualTo(other: TimeRange): boolean {
    return this.toISOString() === other.toISOString();
  }
}
