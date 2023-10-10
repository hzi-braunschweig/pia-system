import { ModuleWithProviders } from '@angular/core';
import { ChartsConfiguration } from './models';
import * as i0 from "@angular/core";
import * as i1 from "./chart/chart.component";
import * as i2 from "./feedback-statistic/feedback-statistic-bar-chart.component";
import * as i3 from "@ngx-translate/core";
export declare class ChartsModule {
    static forRoot(config?: ChartsConfiguration): ModuleWithProviders<ChartsModule>;
    static forChild(config?: ChartsConfiguration): ModuleWithProviders<ChartsModule>;
    static buildModuleWithProviders(config?: ChartsConfiguration): ModuleWithProviders<ChartsModule>;
    static ɵfac: i0.ɵɵFactoryDeclaration<ChartsModule, never>;
    static ɵmod: i0.ɵɵNgModuleDeclaration<ChartsModule, [typeof i1.ChartComponent, typeof i2.FeedbackStatisticBarChartComponent], [typeof i3.TranslateModule], [typeof i1.ChartComponent, typeof i2.FeedbackStatisticBarChartComponent]>;
    static ɵinj: i0.ɵɵInjectorDeclaration<ChartsModule>;
}
