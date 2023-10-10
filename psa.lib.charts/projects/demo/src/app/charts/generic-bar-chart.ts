/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChartConfiguration } from 'chart.js';
import { DataFakerUtility } from 'projects/lib/src/public-api';

export const genericBarChart: ChartConfiguration<'bar'> = {
  type: 'bar',
  data: {
    labels: ['Set 1', 'Set 2', 'Set 3', 'Set 4'],
    datasets: [
      {
        label: 'Series 1',
        data: DataFakerUtility.generateRandomNumberArray(4),
      },
      {
        label: 'Series 2',
        data: DataFakerUtility.generateRandomNumberArray(4),
      },
      {
        label: 'Series 3',
        data: DataFakerUtility.generateRandomNumberArray(4),
      },
      {
        label: 'Series 4',
        data: DataFakerUtility.generateRandomNumberArray(4),
      },
    ],
  },
};
