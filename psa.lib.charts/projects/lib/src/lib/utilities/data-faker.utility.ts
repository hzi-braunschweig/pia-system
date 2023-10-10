/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { add } from 'date-fns';
import { ChartFeedbackStatistic } from '../models';
import { ColorPaletteUtility } from './color-palette.utility';

export class DataFakerUtility {
  /**
   * Generate an array of random numbers, ranging from 0 to 100
   */
  public static generateRandomNumberArray(length: number): number[] {
    const result = [];
    for (let i = 0; i < length; i++) {
      result.push(Math.random() * 100);
    }
    return result;
  }

  public static generateFeedbackStatistic(
    start: Date,
    end: Date,
    duration: Duration,
    labels: string[]
  ): ChartFeedbackStatistic {
    const intervals: [Date, Date][] = [];

    for (let date = start; date <= end; date = add(date, duration)) {
      intervals.push([date, add(date, duration)]);
    }
    intervals.pop();

    const series = labels.map((label, i) => ({
      label,
      color: ColorPaletteUtility.getColorForIterator(i),
      data: this.generateRandomNumberArray(intervals.length),
    }));

    return {
      intervals,
      series,
    };
  }
}
