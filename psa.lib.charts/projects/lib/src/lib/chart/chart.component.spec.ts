/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartComponent } from './chart.component';
import { PIA_CHARTS_CONFIGURATION } from '../pia-charts-configuration.token';
import { Chart, ChartType } from 'chart.js';
import { ColorPaletteUtility } from '../utilities/color-palette.utility';
import { ChartsConfiguration } from '../models';

describe('ChartComponent', () => {
  let component: ChartComponent;
  let fixture: ComponentFixture<ChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChartComponent],
      providers: [
        {
          provide: PIA_CHARTS_CONFIGURATION,
          useValue: <ChartsConfiguration>{
            legend: {
              display: true,
            },
            tooltip: {
              enabled: true,
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChartComponent);
    component = fixture.componentInstance;
    component.config = {
      type: 'bar',
      data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
          {
            label: 'Set',
            data: [12, 19, 3, 5, 2, 3],
          },
        ],
      },
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a canvas', () => {
    const canvas = fixture.nativeElement.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should have a chart', () => {
    expect(component.chart).toBeTruthy();
  });

  it('should update the chart on changes', () => {
    if (component.chart === null) {
      throw new Error('Chart is null');
    }

    const spy = spyOn<Chart<ChartType>, any>(component.chart, 'update');
    component.config.data.datasets[0].data = [1, 2, 3, 4, 5, 6];
    component.ngOnChanges({});
    expect(component.chart?.data).toEqual(component.config.data);
    expect(spy).toHaveBeenCalled();
  });

  it('should throw an error if no config is provided', () => {
    expect(() => component.ngAfterViewInit()).toThrowError();
  });

  it('should apply colors to datasets for bar charts', () => {
    component.config.data.datasets[0].backgroundColor = undefined;
    component.config.data.datasets[0].borderColor = undefined;

    component.ngOnChanges({});
    console.log(component.config.data.datasets[0].backgroundColor);
    expect(component.config.data.datasets[0].backgroundColor).toEqual(
      // @ts-ignore
      ColorPaletteUtility.colors[0]
    );
  });

  it('should apply colors to datasets for line charts', () => {
    component.config.data.datasets[0].backgroundColor = undefined;
    component.config.data.datasets[0].borderColor = undefined;
    component.config.type = 'line';

    component.ngOnChanges({});

    expect(component.config.data.datasets[0].backgroundColor).toEqual(
      // @ts-ignore
      ColorPaletteUtility.colors[0]
    );
    expect(component.config.data.datasets[0].borderColor).toEqual(
      // @ts-ignore
      ColorPaletteUtility.colors[0]
    );
  });

  it('should throw an error if chart type is not supported', () => {
    component.config.type = 'pie' as ChartType;
    expect(() => component.ngOnChanges({})).toThrowError();
  });
});
