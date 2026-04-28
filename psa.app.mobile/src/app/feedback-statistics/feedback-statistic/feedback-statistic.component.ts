/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import {
  ChartFeedbackStatistic,
  FeedbackStatisticDto,
  FeedbackStatisticMapperUtility,
  ChartsModule,
} from '@pia-system/charts';
import {
  RangeCustomEvent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonRange,
  IonButton,
} from '@ionic/angular/standalone';
import { RangeValue } from '@ionic/core/dist/types/components/range/range-interface';
import {
  formatDate,
  NgIf,
  NgClass,
  AsyncPipe,
  DatePipe,
} from '@angular/common';
import { LocaleService } from '../../shared/services/locale/locale.service';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownPipe } from 'ngx-markdown';

export type RangeValueObject = Extract<
  RangeValue,
  { upper: number; lower: number }
>;

@Component({
  selector: 'app-feedback-statistic',
  templateUrl: './feedback-statistic.component.html',
  styleUrls: ['./feedback-statistic.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    NgIf,
    ChartsModule,
    IonRange,
    NgClass,
    IonButton,
    AsyncPipe,
    DatePipe,
    TranslateModule,
    MarkdownPipe,
  ],
})
export class FeedbackStatisticComponent implements OnInit {
  @Input()
  public feedbackStatisticDto: FeedbackStatisticDto | null = null;
  public chartFeedbackStatistic: ChartFeedbackStatistic;
  public showDescription: boolean = false;
  public range: { min: number; max: number };
  public rangeSelection: RangeValueObject;

  public interval: Interval | null = null;

  public constructor(private readonly localeService: LocaleService) {}

  public ngOnInit(): void {
    this.chartFeedbackStatistic = FeedbackStatisticMapperUtility.map(
      this.feedbackStatisticDto
    );

    this.range = {
      min: 1,
      max: this.chartFeedbackStatistic.intervals.length + 1,
    };

    this.setInitialRangeSelection();
    this.setIntervalFromRangeSelection(this.rangeSelection);
  }

  public pinFormatter(value: number): string {
    let dateIndex = 0;
    let intervalIndex = value - 1;

    // Use the intervals end date for the last selection
    if (value === this.range.max) {
      dateIndex = 1;
      intervalIndex -= 1;
    }

    const label =
      this.chartFeedbackStatistic.intervals[intervalIndex][dateIndex];
    return formatDate(label, 'dd.MM.yyyy', this.localeService.currentLocale);
  }

  public selectChartInterval(event: Event) {
    const value = (event as RangeCustomEvent).detail.value;

    if (!this.isRangeValueObject(value)) {
      return;
    }

    // Prevent the user from selecting the same value twice
    if (value.lower === value.upper) {
      if (value.lower === this.range.max) {
        value.lower -= 1;
      } else {
        value.upper += 1;
      }
      this.rangeSelection = value;
    }

    this.setIntervalFromRangeSelection(value);
  }

  private setIntervalFromRangeSelection(value: RangeValueObject) {
    const lower = value.lower - 1;
    const upper = value.upper - 2;

    this.interval = {
      start: this.chartFeedbackStatistic.intervals[lower][0],
      end: this.chartFeedbackStatistic.intervals[upper][1],
    };
  }

  private isRangeValueObject(value: RangeValue): value is RangeValueObject {
    return typeof value === 'object' && 'lower' in value && 'upper' in value;
  }

  private setInitialRangeSelection() {
    const maxBarsToShow = 8;
    const numberOfBarsPerInterval = this.feedbackStatisticDto.data.length;

    const lower = Math.floor(maxBarsToShow / numberOfBarsPerInterval);

    this.rangeSelection = {
      lower: this.range.max - lower,
      upper: this.range.max,
    };
  }
}
