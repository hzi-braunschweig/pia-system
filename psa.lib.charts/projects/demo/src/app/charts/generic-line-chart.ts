/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChartConfiguration, Point } from 'chart.js';

function randomNumber(): number {
  return Math.random() * 100;
}

function createDataSet(label: string): any {
  return {
    label,
    tension: 0.2,
    data: [
      { x: '2023-01-01', y: randomNumber() },
      { x: '2023-01-02', y: randomNumber() },
      { x: '2023-01-03', y: randomNumber() },
      { x: '2023-01-04', y: randomNumber() },
      { x: '2023-01-05', y: randomNumber() },
      { x: '2023-01-06', y: randomNumber() },
      { x: '2023-01-07', y: randomNumber() },
      { x: '2023-01-08', y: randomNumber() },
      { x: '2023-01-09', y: randomNumber() },
      { x: '2023-01-10', y: randomNumber() },
      { x: '2023-01-11', y: randomNumber() },
    ],
  };
}

// Keep in mind, this is not a "real" time series, as we do not use the time series adapter
export const genericLineChart: ChartConfiguration<'line', Point[]> = {
  type: 'line',
  data: {
    datasets: [
      createDataSet('Series 1'),
      createDataSet('Series 2'),
      createDataSet('Series 3'),
      createDataSet('Series 4'),
      createDataSet('Series 5'),
      createDataSet('Series 6'),
      createDataSet('Series 7'),
      createDataSet('Series 8'),
    ],
  },
};
