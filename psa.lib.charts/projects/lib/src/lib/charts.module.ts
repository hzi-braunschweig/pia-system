/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ModuleWithProviders, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PIA_CHARTS_CONFIGURATION } from './pia-charts-configuration.token';
import { defaultConfiguration } from './default-configuration';
import { ChartComponent } from './chart/chart.component';
import { FeedbackStatisticBarChartComponent } from './feedback-statistic/feedback-statistic-bar-chart.component';
import { ChartsConfiguration } from './models';

@NgModule({
  declarations: [ChartComponent, FeedbackStatisticBarChartComponent],
  imports: [TranslateModule],
  exports: [ChartComponent, FeedbackStatisticBarChartComponent],
})
export class ChartsModule {
  static forRoot(
    config?: ChartsConfiguration
  ): ModuleWithProviders<ChartsModule> {
    return this.buildModuleWithProviders(config);
  }

  static forChild(
    config?: ChartsConfiguration
  ): ModuleWithProviders<ChartsModule> {
    return this.buildModuleWithProviders(config);
  }

  public static buildModuleWithProviders(
    config?: ChartsConfiguration
  ): ModuleWithProviders<ChartsModule> {
    return {
      ngModule: ChartsModule,
      providers: [
        {
          provide: PIA_CHARTS_CONFIGURATION,
          useValue: config ?? defaultConfiguration,
        },
      ],
    };
  }
}
