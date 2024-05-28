import { AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartType } from 'chart.js/auto';
import { ChartsConfiguration } from '../models';
import * as i0 from "@angular/core";
export declare class ChartComponent implements OnChanges, AfterViewInit {
    globalConfig: ChartsConfiguration;
    config: ChartConfiguration<ChartType>;
    chart: Chart<ChartType> | null;
    private readonly canvas;
    constructor(globalConfig: ChartsConfiguration);
    ngOnChanges(changes: SimpleChanges): void;
    ngAfterViewInit(): void;
    private prepareChartConfiguration;
    private applyColorsToDataSets;
    private applyPluginConfigurations;
    private applyResponsiveConfiguration;
    private configurePlugin;
    static ɵfac: i0.ɵɵFactoryDeclaration<ChartComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ChartComponent, "pia-chart", never, { "config": { "alias": "config"; "required": false; }; }, {}, never, never, false, never>;
}
