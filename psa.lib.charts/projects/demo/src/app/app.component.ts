/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { add } from 'date-fns';
import { DataFakerUtility } from 'projects/lib/src/public-api';
import { genericBarChart } from './charts/generic-bar-chart';
import { genericLineChart } from './charts/generic-line-chart';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public barChart = genericBarChart;
  public lineChart = genericLineChart;
  public feedbackStatistic = DataFakerUtility.generateFeedbackStatistic(
    new Date('2023-01-01T00:00:00.000Z'),
    add(new Date('2023-01-01T00:00:00.000Z'), { months: 2 }),
    {
      years: 0,
      months: 0,
      weeks: 1,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
    [
      'Sneeze',
      'Blood in urine',
      'Headache',
      "Tummy ache :'(",
      'Running nose',
      'Walking nose',
      'Climbing nose',
    ]
  );

  public twoWeeks: Interval = {
    start: new Date('2023-01-15T00:00:00.000Z'),
    end: new Date('2023-02-11T00:00:00.000Z'),
  };

  public oneWeek: Interval = {
    start: new Date('2023-01-01T00:00:00.000Z'),
    end: new Date('2023-01-08T00:00:00.000Z'),
  };

  public selectedInterval: Interval = this.twoWeeks;

  selectInterval() {
    this.selectedInterval =
      this.selectedInterval === this.twoWeeks ? this.oneWeek : this.twoWeeks;
  }
}
