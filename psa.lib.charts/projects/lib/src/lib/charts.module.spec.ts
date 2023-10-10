/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChartsModule } from './charts.module';
import { ChartsConfiguration } from './models';
import { ModuleWithProviders } from '@angular/core';
import { PIA_CHARTS_CONFIGURATION } from './pia-charts-configuration.token';
import { defaultConfiguration } from './default-configuration';

describe('ChartsModule', () => {
  const config: ChartsConfiguration = {
    legend: {
      position: 'top',
      align: 'start',
    },
    tooltip: {
      enabled: true,
    },
  };
  const expected: ModuleWithProviders<ChartsModule> = {
    ngModule: ChartsModule,
    providers: [
      {
        provide: PIA_CHARTS_CONFIGURATION,
        useValue: config,
      },
    ],
  };
  const providersWithDefaultConfiguration = [
    {
      provide: PIA_CHARTS_CONFIGURATION,
      useValue: defaultConfiguration,
    },
  ];

  describe('forRoot', () => {
    it('should return module with providers', () => {
      expect(ChartsModule.forRoot(config)).toEqual(expected);
    });

    it('should fallback to default configuration', () => {
      expect(ChartsModule.forRoot()).toEqual({
        ...expected,
        providers: providersWithDefaultConfiguration,
      });
    });
  });

  describe('forChild', () => {
    it('should return module with providers', () => {
      expect(ChartsModule.forChild(config)).toEqual(expected);
    });

    it('should fallback to default configuration', () => {
      expect(ChartsModule.forChild()).toEqual({
        ...expected,
        providers: providersWithDefaultConfiguration,
      });
    });
  });
});
