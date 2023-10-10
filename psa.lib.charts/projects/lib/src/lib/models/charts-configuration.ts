/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { PluginOptionsByType } from 'chart.js';
import { ChartType } from 'chart.js/auto';

export interface ChartsConfiguration {
  colors?: string[];
  legend?: Partial<PluginOptionsByType<ChartType>['legend']>;
  tooltip?: Partial<PluginOptionsByType<ChartType>['tooltip']>;
}
