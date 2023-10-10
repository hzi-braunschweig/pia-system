/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PIA_CHARTS_CONFIGURATION } from './pia-charts-configuration.token';
import { defaultConfiguration } from './default-configuration';
import { ChartComponent } from './chart/chart.component';
import { FeedbackStatisticBarChartComponent } from './feedback-statistic/feedback-statistic-bar-chart.component';
import * as i0 from "@angular/core";
export class ChartsModule {
    static forRoot(config) {
        return this.buildModuleWithProviders(config);
    }
    static forChild(config) {
        return this.buildModuleWithProviders(config);
    }
    static buildModuleWithProviders(config) {
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
ChartsModule.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartsModule, deps: [], target: i0.ɵɵFactoryTarget.NgModule });
ChartsModule.ɵmod = i0.ɵɵngDeclareNgModule({ minVersion: "14.0.0", version: "14.2.12", ngImport: i0, type: ChartsModule, declarations: [ChartComponent, FeedbackStatisticBarChartComponent], imports: [TranslateModule], exports: [ChartComponent, FeedbackStatisticBarChartComponent] });
ChartsModule.ɵinj = i0.ɵɵngDeclareInjector({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartsModule, imports: [TranslateModule] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartsModule, decorators: [{
            type: NgModule,
            args: [{
                    declarations: [ChartComponent, FeedbackStatisticBarChartComponent],
                    imports: [TranslateModule],
                    exports: [ChartComponent, FeedbackStatisticBarChartComponent],
                }]
        }] });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2hhcnRzLm1vZHVsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3Byb2plY3RzL2xpYi9zcmMvbGliL2NoYXJ0cy5tb2R1bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7R0FJRztBQUVILE9BQU8sRUFBdUIsUUFBUSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQzlELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUM1RSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUMvRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDekQsT0FBTyxFQUFFLGtDQUFrQyxFQUFFLE1BQU0sNkRBQTZELENBQUM7O0FBUWpILE1BQU0sT0FBTyxZQUFZO0lBQ3ZCLE1BQU0sQ0FBQyxPQUFPLENBQ1osTUFBNEI7UUFFNUIsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVELE1BQU0sQ0FBQyxRQUFRLENBQ2IsTUFBNEI7UUFFNUIsT0FBTyxJQUFJLENBQUMsd0JBQXdCLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUVNLE1BQU0sQ0FBQyx3QkFBd0IsQ0FDcEMsTUFBNEI7UUFFNUIsT0FBTztZQUNMLFFBQVEsRUFBRSxZQUFZO1lBQ3RCLFNBQVMsRUFBRTtnQkFDVDtvQkFDRSxPQUFPLEVBQUUsd0JBQXdCO29CQUNqQyxRQUFRLEVBQUUsTUFBTSxJQUFJLG9CQUFvQjtpQkFDekM7YUFDRjtTQUNGLENBQUM7SUFDSixDQUFDOzswR0F6QlUsWUFBWTsyR0FBWixZQUFZLGlCQUpSLGNBQWMsRUFBRSxrQ0FBa0MsYUFDdkQsZUFBZSxhQUNmLGNBQWMsRUFBRSxrQ0FBa0M7MkdBRWpELFlBQVksWUFIYixlQUFlOzRGQUdkLFlBQVk7a0JBTHhCLFFBQVE7bUJBQUM7b0JBQ1IsWUFBWSxFQUFFLENBQUMsY0FBYyxFQUFFLGtDQUFrQyxDQUFDO29CQUNsRSxPQUFPLEVBQUUsQ0FBQyxlQUFlLENBQUM7b0JBQzFCLE9BQU8sRUFBRSxDQUFDLGNBQWMsRUFBRSxrQ0FBa0MsQ0FBQztpQkFDOUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogU1BEWC1GaWxlQ29weXJpZ2h0VGV4dDogMjAyMyBIZWxtaG9sdHotWmVudHJ1bSBmw7xyIEluZmVrdGlvbnNmb3JzY2h1bmcgR21iSCAoSFpJKSA8UGlhUG9zdEBoZWxtaG9sdHotaHppLmRlPlxuICpcbiAqIFNQRFgtTGljZW5zZS1JZGVudGlmaWVyOiBBR1BMLTMuMC1vci1sYXRlclxuICovXG5cbmltcG9ydCB7IE1vZHVsZVdpdGhQcm92aWRlcnMsIE5nTW9kdWxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBUcmFuc2xhdGVNb2R1bGUgfSBmcm9tICdAbmd4LXRyYW5zbGF0ZS9jb3JlJztcbmltcG9ydCB7IFBJQV9DSEFSVFNfQ09ORklHVVJBVElPTiB9IGZyb20gJy4vcGlhLWNoYXJ0cy1jb25maWd1cmF0aW9uLnRva2VuJztcbmltcG9ydCB7IGRlZmF1bHRDb25maWd1cmF0aW9uIH0gZnJvbSAnLi9kZWZhdWx0LWNvbmZpZ3VyYXRpb24nO1xuaW1wb3J0IHsgQ2hhcnRDb21wb25lbnQgfSBmcm9tICcuL2NoYXJ0L2NoYXJ0LmNvbXBvbmVudCc7XG5pbXBvcnQgeyBGZWVkYmFja1N0YXRpc3RpY0JhckNoYXJ0Q29tcG9uZW50IH0gZnJvbSAnLi9mZWVkYmFjay1zdGF0aXN0aWMvZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQnO1xuaW1wb3J0IHsgQ2hhcnRzQ29uZmlndXJhdGlvbiB9IGZyb20gJy4vbW9kZWxzJztcblxuQE5nTW9kdWxlKHtcbiAgZGVjbGFyYXRpb25zOiBbQ2hhcnRDb21wb25lbnQsIEZlZWRiYWNrU3RhdGlzdGljQmFyQ2hhcnRDb21wb25lbnRdLFxuICBpbXBvcnRzOiBbVHJhbnNsYXRlTW9kdWxlXSxcbiAgZXhwb3J0czogW0NoYXJ0Q29tcG9uZW50LCBGZWVkYmFja1N0YXRpc3RpY0JhckNoYXJ0Q29tcG9uZW50XSxcbn0pXG5leHBvcnQgY2xhc3MgQ2hhcnRzTW9kdWxlIHtcbiAgc3RhdGljIGZvclJvb3QoXG4gICAgY29uZmlnPzogQ2hhcnRzQ29uZmlndXJhdGlvblxuICApOiBNb2R1bGVXaXRoUHJvdmlkZXJzPENoYXJ0c01vZHVsZT4ge1xuICAgIHJldHVybiB0aGlzLmJ1aWxkTW9kdWxlV2l0aFByb3ZpZGVycyhjb25maWcpO1xuICB9XG5cbiAgc3RhdGljIGZvckNoaWxkKFxuICAgIGNvbmZpZz86IENoYXJ0c0NvbmZpZ3VyYXRpb25cbiAgKTogTW9kdWxlV2l0aFByb3ZpZGVyczxDaGFydHNNb2R1bGU+IHtcbiAgICByZXR1cm4gdGhpcy5idWlsZE1vZHVsZVdpdGhQcm92aWRlcnMoY29uZmlnKTtcbiAgfVxuXG4gIHB1YmxpYyBzdGF0aWMgYnVpbGRNb2R1bGVXaXRoUHJvdmlkZXJzKFxuICAgIGNvbmZpZz86IENoYXJ0c0NvbmZpZ3VyYXRpb25cbiAgKTogTW9kdWxlV2l0aFByb3ZpZGVyczxDaGFydHNNb2R1bGU+IHtcbiAgICByZXR1cm4ge1xuICAgICAgbmdNb2R1bGU6IENoYXJ0c01vZHVsZSxcbiAgICAgIHByb3ZpZGVyczogW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZTogUElBX0NIQVJUU19DT05GSUdVUkFUSU9OLFxuICAgICAgICAgIHVzZVZhbHVlOiBjb25maWcgPz8gZGVmYXVsdENvbmZpZ3VyYXRpb24sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG4gIH1cbn1cbiJdfQ==