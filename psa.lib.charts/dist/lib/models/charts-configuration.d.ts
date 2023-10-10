import { PluginOptionsByType } from 'chart.js';
import { ChartType } from 'chart.js/auto';
export interface ChartsConfiguration {
    colors?: string[];
    legend?: Partial<PluginOptionsByType<ChartType>['legend']>;
    tooltip?: Partial<PluginOptionsByType<ChartType>['tooltip']>;
}
