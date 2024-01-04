/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  ChartFeedbackStatistic,
  FeedbackStatisticDto,
  FeedbackStatisticMapperUtility,
} from '@pia-system/charts';
import { FormControl, FormGroup } from '@angular/forms';
import { formatDate } from '@angular/common';
import { CurrentUser } from '../../../_services/current-user.service';

export type RangeValueObject = { upper: number; lower: number };

@Component({
  selector: 'app-feedback-statistic',
  templateUrl: './feedback-statistic.component.html',
  styleUrls: ['./feedback-statistic.component.scss'],
})
export class FeedbackStatisticComponent implements OnInit {
  @Input()
  public feedbackStatisticDto: FeedbackStatisticDto | null = null;

  @Input()
  public isEditable: boolean = false;

  @Output()
  public remove = new EventEmitter<number>();

  public chartFeedbackStatistic: ChartFeedbackStatistic;

  public showDescription: boolean = false;

  public range: { min: number; max: number };

  public rangeSelection = new FormGroup({
    upper: new FormControl(1),
    lower: new FormControl(1),
  });

  public interval: Interval | null = null;

  constructor(private readonly currentUser: CurrentUser) {}

  public ngOnInit(): void {
    this.chartFeedbackStatistic = FeedbackStatisticMapperUtility.map(
      this.feedbackStatisticDto
    );

    if (!this.chartFeedbackStatistic) {
      return;
    }

    this.range = {
      min: 1,
      max: this.chartFeedbackStatistic.intervals.length + 1,
    };

    this.setInitialRangeSelection();
    this.rangeSelection.valueChanges.subscribe((value) =>
      this.setIntervalFromRangeSelection(value)
    );
  }

  public getLabelFormatter(): (value: number) => string {
    return (value: number): string => {
      if (value === undefined || value === null) {
        return null;
      }
      const isLower = value === this.rangeSelection.controls.lower.value;
      let date: Date;

      if (isLower && value <= this.chartFeedbackStatistic.intervals.length) {
        date = this.chartFeedbackStatistic.intervals[value - 1][0];
      } else {
        date = this.chartFeedbackStatistic.intervals[value - 2][1];
      }

      if (!date) {
        return null;
      }

      return formatDate(date, 'dd.MM.yyyy', this.currentUser.locale);
    };
  }

  private setIntervalFromRangeSelection(value: Partial<RangeValueObject>) {
    const lower = value.lower - 1;
    const upper = value.upper - 2;

    if (lower > this.chartFeedbackStatistic.intervals.length || upper < -1) {
      throw new Error('range out of bounds for chartFeedbackStatistic');
    }

    const startValue =
      lower === this.chartFeedbackStatistic.intervals.length
        ? this.chartFeedbackStatistic.intervals[lower - 1][1]
        : this.chartFeedbackStatistic.intervals[lower][0];

    const endValue =
      upper === -1
        ? this.chartFeedbackStatistic.intervals[0][0]
        : this.chartFeedbackStatistic.intervals[upper][1];

    this.interval = {
      start: startValue,
      end: endValue,
    };
  }

  private setInitialRangeSelection() {
    const maxBarsToShow = 8;
    const numberOfBarsPerInterval = this.feedbackStatisticDto.data.length;

    const lower = Math.floor(maxBarsToShow / numberOfBarsPerInterval);

    this.rangeSelection.setValue({
      lower: Math.max(this.range.max - lower, this.range.min),
      upper: this.range.max,
    });

    this.setIntervalFromRangeSelection(this.rangeSelection.value);
  }
}
