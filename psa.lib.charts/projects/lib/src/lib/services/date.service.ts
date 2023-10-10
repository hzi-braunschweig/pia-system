/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  Duration,
  format,
  intervalToDuration,
} from 'date-fns';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class DateService {
  constructor(private readonly translateService: TranslateService) {}

  public getDuration(interval: Date[]): Duration {
    const [start, end] = interval;
    return intervalToDuration({ start, end });
  }

  /**
   * Returns true if a duration is regular, e.g. if the duration is exactly 1 unit
   */
  public isDurationRegular(duration: Duration): boolean {
    let isRegular =
      Object.values(duration).filter((value) => value === 1).length === 1;

    if (!isRegular) {
      isRegular = duration.days === 7;
    }

    return isRegular;
  }

  public getLabelForInterval(
    timeSeriesBeginning: Date,
    interval: Date[]
  ): string {
    const [start, end] = interval;
    const duration = this.getDuration(interval);
    const isDurationRegular = this.isDurationRegular(duration);

    if (duration.hours) {
      return format(start, 'dd.MM.yyyy HH:mm') + ' - ' + format(end, 'HH:mm');
    }

    if (isDurationRegular) {
      return this.getLabelForRegularInterval(
        timeSeriesBeginning,
        start,
        duration
      );
    }
    return this.getLabelForIrregularInterval(
      timeSeriesBeginning,
      start,
      duration
    );
  }

  private getLabelForRegularInterval(
    timeSeriesBeginning: Date,
    start: Date,
    duration: Duration
  ) {
    const { months, days, years, hours } = duration;

    if (hours) {
      return format(start, 'dd.MM.yyyy HH:mm');
    }

    const index = this.getLastIndexForInterval(
      timeSeriesBeginning,
      start,
      duration
    );

    if (months) {
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.MONTH'
      )} ${index}`;
    }
    if (days === 1) {
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.DAY'
      )} ${index}`;
    }
    if (days === 7) {
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.WEEK'
      )} ${index}`;
    }
    if (years) {
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.YEAR'
      )} ${index}`;
    }
    return '';
  }

  private getLabelForIrregularInterval(
    timeSeriesBeginning: Date,
    start: Date,
    duration: Duration
  ): string {
    const { months, days, years } = duration;

    const lastIndex = this.getLastIndexForInterval(
      timeSeriesBeginning,
      start,
      duration
    );

    if (months) {
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.MONTHS'
      )} ${this.returnIndexRangeString(months, lastIndex)}`;
    }
    if (days) {
      if (days % 7 === 0) {
        return `${this.translateService.instant(
          'CHARTS.FEEDBACK_STATISTIC.WEEKS'
        )} ${this.returnIndexRangeString(days / 7, lastIndex)}`;
      }
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.DAYS'
      )} ${this.returnIndexRangeString(days, lastIndex)}`;
    }
    if (years) {
      return `${this.translateService.instant(
        'CHARTS.FEEDBACK_STATISTIC.YEARS'
      )} ${this.returnIndexRangeString(years, lastIndex)}`;
    }
    return '';
  }

  private returnIndexRangeString(duration: number, lastIndex: number): string {
    return `${lastIndex + 1 - duration}-${lastIndex}`;
  }

  private getLastIndexForInterval(
    timeSeriesBeginning: Date,
    start: Date,
    duration: Duration
  ): number {
    const { months, days, years } = duration;
    if (years) {
      return differenceInYears(start, timeSeriesBeginning) + years;
    }

    if (months) {
      return differenceInMonths(start, timeSeriesBeginning) + months;
    }

    if (days) {
      if (days % 7 === 0) {
        return differenceInWeeks(start, timeSeriesBeginning) + days / 7;
      }
      return differenceInDays(start, timeSeriesBeginning) + days;
    }

    throw new Error(`Unsupported duration: ${JSON.stringify(duration)}`);
  }

  public isIntervalWithDateObjects(
    p: any
  ): p is Interval & { start: Date; end: Date } {
    return p && p.start instanceof Date && p.end instanceof Date;
  }
}
