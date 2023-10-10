/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { ChartDataset } from 'chart.js';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';
import { PluginOptionsByType } from 'chart.js/dist/types';
import { ChartsConfiguration } from '../models';
import { PIA_CHARTS_CONFIGURATION } from '../pia-charts-configuration.token';
import { ColorPaletteUtility } from '../utilities/color-palette.utility';

@Component({
  selector: 'pia-chart',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartComponent implements OnChanges, AfterViewInit {
  @Input()
  public config!: ChartConfiguration<ChartType>;
  public chart: Chart<ChartType> | null = null;

  @ViewChild('canvas', { read: ElementRef })
  private readonly canvas: ElementRef | null = null;

  public constructor(
    @Inject(PIA_CHARTS_CONFIGURATION)
    public globalConfig: ChartsConfiguration
  ) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.chart !== null) {
      this.prepareChartConfiguration();
      this.chart.data = this.config.data;
      this.chart.update();
    }
  }

  public ngAfterViewInit(): void {
    this.prepareChartConfiguration();

    this.chart = new Chart(this.canvas?.nativeElement, this.config);
  }

  private prepareChartConfiguration(): void {
    this.applyColorsToDataSets();
    this.applyPluginConfigurations();
    this.applyResponsiveConfiguration();
  }

  private applyColorsToDataSets(): void {
    if (this.config.data.datasets.length === 0) {
      return;
    }

    let transformer: (
      dataset: ChartDataset<ChartType>,
      index: number
    ) => ChartDataset<ChartType>;

    switch (this.config.type) {
      case 'bar':
        transformer = (dataset, i) => {
          dataset.backgroundColor = ColorPaletteUtility.getColorForIterator(i);
          return dataset;
        };
        break;
      case 'line':
        transformer = (dataset, i) => {
          dataset.borderColor = ColorPaletteUtility.getColorForIterator(i);
          dataset.backgroundColor = dataset.borderColor;
          return dataset;
        };
        break;
      default:
        throw new Error('Unsupported chart type: ' + this.config.type);
    }

    this.config.data.datasets = this.config.data.datasets.map(
      (dataset, index) =>
        // don't override colors
        dataset.backgroundColor ? dataset : transformer(dataset, index)
    );
  }

  private applyPluginConfigurations() {
    if (this.globalConfig.legend) {
      this.configurePlugin('legend', this.globalConfig.legend);
    }

    if (this.globalConfig.tooltip) {
      this.configurePlugin('tooltip', this.globalConfig.tooltip);
    }
  }

  private applyResponsiveConfiguration(): void {
    this.config = {
      ...this.config,
      options: {
        ...this.config.options,
        maintainAspectRatio: false,
      },
    };
  }

  private configurePlugin(
    key: keyof PluginOptionsByType<ChartType>,
    pluginConfig: Partial<
      PluginOptionsByType<ChartType>[keyof PluginOptionsByType<ChartType>]
    >
  ) {
    this.config = {
      ...this.config,
      options: {
        ...this.config.options,
        plugins: {
          ...(this.config.options?.plugins ? this.config.options.plugins : {}),
          [key]: {
            ...(typeof this.config.options?.plugins === 'object' &&
            key in this.config.options.plugins
              ? this.config.options.plugins[key]
              : {}),
            ...pluginConfig,
          },
        },
      },
    };
  }
}
