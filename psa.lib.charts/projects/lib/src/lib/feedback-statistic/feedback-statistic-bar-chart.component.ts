/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartDataset, Ticks } from 'chart.js';
import { ChartConfiguration } from 'chart.js/auto';
import { intlFormat } from 'date-fns';
import { ChartFeedbackStatistic } from '../models';
import { DateService } from '../services/date.service';

@Component({
  selector: 'pia-feedback-statistic-bar-chart',
  templateUrl: './feedback-statistic-bar-chart.component.html',
  styleUrls: ['./feedback-statistic-bar-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackStatisticBarChartComponent implements OnChanges, OnInit {
  @Input() public feedbackStatistic: ChartFeedbackStatistic | null = null;
  @Input() public interval: Interval | null = null;

  public config: ChartConfiguration<'bar'> = this.returnBaseChartConfig();

  private labels: string[] = [];
  private dataset: ChartDataset<'bar'>[] = [];
  private datasetIndexRange: number[] = [];

  public constructor(
    private readonly dateService: DateService,
    private readonly translationService: TranslateService
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['feedbackStatistic'] || changes['interval']) {
      this.config = this.returnBaseChartConfig();
      this.updateConfig();
    }
  }

  public ngOnInit(): void {
    this.updateConfig();
  }

  private updateConfig(): void {
    this.setLabels();
    this.setDataset();

    this.config = {
      ...this.config,
      data: {
        labels: this.labels,
        datasets: this.dataset,
      },
    };
  }

  private setLabels() {
    this.labels = this.renderLabels();
  }

  private setDataset() {
    this.dataset = this.renderDatasets();
  }

  private renderLabels(): string[] {
    if (!this.feedbackStatistic?.intervals.length) {
      return [];
    }

    const timeSeriesBeginning = this.feedbackStatistic.intervals[0][0];
    let intervals: Date[][] = [...this.feedbackStatistic.intervals];

    if (this.dateService.isIntervalWithDateObjects(this.interval)) {
      const { start, end } = this.interval;

      intervals = intervals.filter((i) => i[0] >= start && i[1] <= end);

      this.datasetIndexRange = [
        this.feedbackStatistic.intervals.indexOf(intervals[0]),
        this.feedbackStatistic.intervals.indexOf(
          intervals[intervals.length - 1]
        ),
      ];
    }

    return intervals.map((interval, index) =>
      this.dateService.getLabelForInterval(timeSeriesBeginning, interval)
    );
  }

  private renderDatasets(): ChartDataset<'bar'>[] {
    if (!this.feedbackStatistic?.series.length) {
      return [];
    }

    return this.feedbackStatistic.series.map((series) => {
      return {
        label: series.label,
        backgroundColor: series.color ?? undefined,
        data: this.datasetIndexRange.length
          ? series.data.slice(
              this.datasetIndexRange[0],
              this.datasetIndexRange[1] + 1
            )
          : series.data,
      };
    });
  }

  private formatDate(date: Date): string {
    return intlFormat(date, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  private returnBaseChartConfig(): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        datasets: [],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            min: 0,
            max: 100,
            title: {
              display: true,
              text: this.translationService.instant(
                'CHARTS.FEEDBACK_STATISTIC.RELATIVE_FREQUENCY'
              ),
            },
            ticks: {
              display: true,
              autoSkip: false,
              maxTicksLimit: 20,
              // Only render first and last tick with percentage sign
              callback(value, index, ticks) {
                if (index === 0 || index === ticks.length - 1) {
                  value = Ticks.formatters.numeric.apply(this, [
                    +value,
                    index,
                    ticks,
                  ]);
                  return `${value}%`;
                }

                return '';
              },
            },
          },
          x: {
            offset: true,
            title: {
              display: true,
              text: '',
            },
          },
        },
      },
    };
  }
}
