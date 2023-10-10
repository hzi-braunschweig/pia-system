/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export interface ChartFeedbackSeries {
  label: string;
  color: string;
  data: number[];
}

export interface ChartFeedbackStatistic {
  intervals: Date[][];
  series: ChartFeedbackSeries[];
}
