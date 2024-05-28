/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { ChangeDetectionStrategy, Component, Input, } from '@angular/core';
import { Ticks } from 'chart.js';
import { intlFormat } from 'date-fns';
import * as i0 from "@angular/core";
import * as i1 from "../services/date.service";
import * as i2 from "@ngx-translate/core";
import * as i3 from "../chart/chart.component";
export class FeedbackStatisticBarChartComponent {
    constructor(dateService, translationService) {
        this.dateService = dateService;
        this.translationService = translationService;
        this.feedbackStatistic = null;
        this.interval = null;
        this.config = this.returnBaseChartConfig();
        this.labels = [];
        this.dataset = [];
        this.datasetIndexRange = [];
    }
    ngOnChanges(changes) {
        if (changes['feedbackStatistic'] || changes['interval']) {
            this.config = this.returnBaseChartConfig();
            this.updateConfig();
        }
    }
    ngOnInit() {
        this.updateConfig();
    }
    updateConfig() {
        this.setLabels();
        this.setDataset();
        this.config = {
            ...this.config,
            data: {
                labels: this.labels,
                datasets: this.dataset,
            },
        };
    }
    setLabels() {
        this.labels = this.renderLabels();
    }
    setDataset() {
        this.dataset = this.renderDatasets();
    }
    renderLabels() {
        if (!this.feedbackStatistic?.intervals.length) {
            return [];
        }
        const timeSeriesBeginning = this.feedbackStatistic.intervals[0][0];
        let intervals = [...this.feedbackStatistic.intervals];
        if (this.dateService.isIntervalWithDateObjects(this.interval)) {
            const { start, end } = this.interval;
            intervals = intervals.filter((i) => i[0] >= start && i[1] <= end);
            this.datasetIndexRange = [
                this.feedbackStatistic.intervals.indexOf(intervals[0]),
                this.feedbackStatistic.intervals.indexOf(intervals[intervals.length - 1]),
            ];
        }
        return intervals.map((interval, index) => this.dateService.getLabelForInterval(timeSeriesBeginning, interval));
    }
    renderDatasets() {
        if (!this.feedbackStatistic?.series.length) {
            return [];
        }
        return this.feedbackStatistic.series.map((series) => {
            return {
                label: series.label,
                backgroundColor: series.color ?? undefined,
                data: this.datasetIndexRange.length
                    ? series.data.slice(this.datasetIndexRange[0], this.datasetIndexRange[1] + 1)
                    : series.data,
            };
        });
    }
    formatDate(date) {
        return intlFormat(date, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    }
    returnBaseChartConfig() {
        return {
            type: 'bar',
            data: {
                datasets: [],
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: this.translationService.instant('CHARTS.FEEDBACK_STATISTIC.RELATIVE_FREQUENCY'),
                        },
                        ticks: {
                            display: true,
                            autoSkip: false,
                            maxTicksLimit: 20,
                            // Only render first and last tick with percentage sign
                            callback(value, index, ticks) {
                                if (index === 0 || index === ticks.length - 1) {
                                    value = Ticks.formatters.numeric.apply(this, [
                                        +value,
                                        index,
                                        ticks,
                                    ]);
                                    return `${value}%`;
                                }
                                return '';
                            },
                        },
                    },
                    x: {
                        offset: true,
                        title: {
                            display: true,
                            text: '',
                        },
                    },
                },
            },
        };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "17.3.5", ngImport: i0, type: FeedbackStatisticBarChartComponent, deps: [{ token: i1.DateService }, { token: i2.TranslateService }], target: i0.ɵɵFactoryTarget.Component }); }
    static { this.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "17.3.5", type: FeedbackStatisticBarChartComponent, selector: "pia-feedback-statistic-bar-chart", inputs: { feedbackStatistic: "feedbackStatistic", interval: "interval" }, usesOnChanges: true, ngImport: i0, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<pia-chart [config]=\"config\"></pia-chart>\n", styles: [":host{display:block}mat-slider{display:block;margin:0 auto;width:80%}\n"], dependencies: [{ kind: "component", type: i3.ChartComponent, selector: "pia-chart", inputs: ["config"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "17.3.5", ngImport: i0, type: FeedbackStatisticBarChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pia-feedback-statistic-bar-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<pia-chart [config]=\"config\"></pia-chart>\n", styles: [":host{display:block}mat-slider{display:block;margin:0 auto;width:80%}\n"] }]
        }], ctorParameters: () => [{ type: i1.DateService }, { type: i2.TranslateService }], propDecorators: { feedbackStatistic: [{
                type: Input
            }], interval: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9saWIvc3JjL2xpYi9mZWVkYmFjay1zdGF0aXN0aWMvZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9saWIvc3JjL2xpYi9mZWVkYmFjay1zdGF0aXN0aWMvZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBRUgsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixTQUFTLEVBQ1QsS0FBSyxHQUlOLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBZ0IsS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRS9DLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7O0FBVXRDLE1BQU0sT0FBTyxrQ0FBa0M7SUFVN0MsWUFDbUIsV0FBd0IsRUFDeEIsa0JBQW9DO1FBRHBDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBQ3hCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBa0I7UUFYdkMsc0JBQWlCLEdBQWtDLElBQUksQ0FBQztRQUN4RCxhQUFRLEdBQW9CLElBQUksQ0FBQztRQUUxQyxXQUFNLEdBQThCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBRWhFLFdBQU0sR0FBYSxFQUFFLENBQUM7UUFDdEIsWUFBTyxHQUEwQixFQUFFLENBQUM7UUFDcEMsc0JBQWlCLEdBQWEsRUFBRSxDQUFDO0lBS3RDLENBQUM7SUFFRyxXQUFXLENBQUMsT0FBc0I7UUFDdkMsSUFBSSxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQztZQUN4RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FB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SyxHQUFHLENBQUM7Z0NBQ3JCLENBQUM7Z0NBRUQsT0FBTyxFQUFFLENBQUM7NEJBQ1osQ0FBQzt5QkFDRjtxQkFDRjtvQkFDRCxDQUFDLEVBQUU7d0JBQ0QsTUFBTSxFQUFFLElBQUk7d0JBQ1osS0FBSyxFQUFFOzRCQUNMLE9BQU8sRUFBRSxJQUFJOzRCQUNiLElBQUksRUFBRSxFQUFFO3lCQUNUO3FCQUNGO2lCQUNGO2FBQ0Y7U0FDRixDQUFDO0lBQ0osQ0FBQzs4R0FwSlUsa0NBQWtDO2tHQUFsQyxrQ0FBa0MsdUtDM0IvQywwT0FPQTs7MkZEb0JhLGtDQUFrQztrQkFOOUMsU0FBUzsrQkFDRSxrQ0FBa0MsbUJBRzNCLHVCQUF1QixDQUFDLE1BQU07K0dBRy9CLGlCQUFpQjtzQkFBaEMsS0FBSztnQkFDVSxRQUFRO3NCQUF2QixLQUFLIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIFNQRFgtRmlsZUNvcHlyaWdodFRleHQ6IDIwMjMgSGVsbWhvbHR6LVplbnRydW0gZsO8ciBJbmZla3Rpb25zZm9yc2NodW5nIEdtYkggKEhaSSkgPFBpYVBvc3RAaGVsbWhvbHR6LWh6aS5kZT5cbiAqXG4gKiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbiAqL1xuXG5pbXBvcnQge1xuICBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneSxcbiAgQ29tcG9uZW50LFxuICBJbnB1dCxcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIFNpbXBsZUNoYW5nZXMsXG59IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVHJhbnNsYXRlU2VydmljZSB9IGZyb20gJ0BuZ3gtdHJhbnNsYXRlL2NvcmUnO1xuaW1wb3J0IHsgQ2hhcnREYXRhc2V0LCBUaWNrcyB9IGZyb20gJ2NoYXJ0LmpzJztcbmltcG9ydCB7IENoYXJ0Q29uZmlndXJhdGlvbiB9IGZyb20gJ2NoYXJ0LmpzL2F1dG8nO1xuaW1wb3J0IHsgaW50bEZvcm1hdCB9IGZyb20gJ2RhdGUtZm5zJztcbmltcG9ydCB7IENoYXJ0RmVlZGJhY2tTdGF0aXN0aWMgfSBmcm9tICcuLi9tb2RlbHMnO1xuaW1wb3J0IHsgRGF0ZVNlcnZpY2UgfSBmcm9tICcuLi9zZXJ2aWNlcy9kYXRlLnNlcnZpY2UnO1xuXG5AQ29tcG9uZW50KHtcbiAgc2VsZWN0b3I6ICdwaWEtZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydCcsXG4gIHRlbXBsYXRlVXJsOiAnLi9mZWVkYmFjay1zdGF0aXN0aWMtYmFyLWNoYXJ0LmNvbXBvbmVudC5odG1sJyxcbiAgc3R5bGVVcmxzOiBbJy4vZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQuY3NzJ10sXG4gIGNoYW5nZURldGVjdGlvbjogQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3kuT25QdXNoLFxufSlcbmV4cG9ydCBjbGFzcyBGZWVkYmFja1N0YXRpc3RpY0JhckNoYXJ0Q29tcG9uZW50IGltcGxlbWVudHMgT25DaGFuZ2VzLCBPbkluaXQge1xuICBASW5wdXQoKSBwdWJsaWMgZmVlZGJhY2tTdGF0aXN0aWM6IENoYXJ0RmVlZGJhY2tTdGF0aXN0aWMgfCBudWxsID0gbnVsbDtcbiAgQElucHV0KCkgcHVibGljIGludGVydmFsOiBJbnRlcnZhbCB8IG51bGwgPSBudWxsO1xuXG4gIHB1YmxpYyBjb25maWc6IENoYXJ0Q29uZmlndXJhdGlvbjwnYmFyJz4gPSB0aGlzLnJldHVybkJhc2VDaGFydENvbmZpZygpO1xuXG4gIHByaXZhdGUgbGFiZWxzOiBzdHJpbmdbXSA9IFtdO1xuICBwcml2YXRlIGRhdGFzZXQ6IENoYXJ0RGF0YXNldDwnYmFyJz5bXSA9IFtdO1xuICBwcml2YXRlIGRhdGFzZXRJbmRleFJhbmdlOiBudW1iZXJbXSA9IFtdO1xuXG4gIHB1YmxpYyBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRhdGVTZXJ2aWNlOiBEYXRlU2VydmljZSxcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRyYW5zbGF0aW9uU2VydmljZTogVHJhbnNsYXRlU2VydmljZVxuICApIHt9XG5cbiAgcHVibGljIG5nT25DaGFuZ2VzKGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMpOiB2b2lkIHtcbiAgICBpZiAoY2hhbmdlc1snZmVlZGJhY2tTdGF0aXN0aWMnXSB8fCBjaGFuZ2VzWydpbnRlcnZhbCddKSB7XG4gICAgICB0aGlzLmNvbmZpZyA9IHRoaXMucmV0dXJuQmFzZUNoYXJ0Q29uZmlnKCk7XG4gICAgICB0aGlzLnVwZGF0ZUNvbmZpZygpO1xuICAgIH1cbiAgfVxuXG4gIHB1YmxpYyBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICB0aGlzLnVwZGF0ZUNvbmZpZygpO1xuICB9XG5cbiAgcHJpdmF0ZSB1cGRhdGVDb25maWcoKTogdm9pZCB7XG4gICAgdGhpcy5zZXRMYWJlbHMoKTtcbiAgICB0aGlzLnNldERhdGFzZXQoKTtcblxuICAgIHRoaXMuY29uZmlnID0ge1xuICAgICAgLi4udGhpcy5jb25maWcsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGxhYmVsczogdGhpcy5sYWJlbHMsXG4gICAgICAgIGRhdGFzZXRzOiB0aGlzLmRhdGFzZXQsXG4gICAgICB9LFxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIHNldExhYmVscygpIHtcbiAgICB0aGlzLmxhYmVscyA9IHRoaXMucmVuZGVyTGFiZWxzKCk7XG4gIH1cblxuICBwcml2YXRlIHNldERhdGFzZXQoKSB7XG4gICAgdGhpcy5kYXRhc2V0ID0gdGhpcy5yZW5kZXJEYXRhc2V0cygpO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJMYWJlbHMoKTogc3RyaW5nW10ge1xuICAgIGlmICghdGhpcy5mZWVkYmFja1N0YXRpc3RpYz8uaW50ZXJ2YWxzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHRpbWVTZXJpZXNCZWdpbm5pbmcgPSB0aGlzLmZlZWRiYWNrU3RhdGlzdGljLmludGVydmFsc1swXVswXTtcbiAgICBsZXQgaW50ZXJ2YWxzOiBEYXRlW11bXSA9IFsuLi50aGlzLmZlZWRiYWNrU3RhdGlzdGljLmludGVydmFsc107XG5cbiAgICBpZiAodGhpcy5kYXRlU2VydmljZS5pc0ludGVydmFsV2l0aERhdGVPYmplY3RzKHRoaXMuaW50ZXJ2YWwpKSB7XG4gICAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IHRoaXMuaW50ZXJ2YWw7XG5cbiAgICAgIGludGVydmFscyA9IGludGVydmFscy5maWx0ZXIoKGkpID0+IGlbMF0gPj0gc3RhcnQgJiYgaVsxXSA8PSBlbmQpO1xuXG4gICAgICB0aGlzLmRhdGFzZXRJbmRleFJhbmdlID0gW1xuICAgICAgICB0aGlzLmZlZWRiYWNrU3RhdGlzdGljLmludGVydmFscy5pbmRleE9mKGludGVydmFsc1swXSksXG4gICAgICAgIHRoaXMuZmVlZGJhY2tTdGF0aXN0aWMuaW50ZXJ2YWxzLmluZGV4T2YoXG4gICAgICAgICAgaW50ZXJ2YWxzW2ludGVydmFscy5sZW5ndGggLSAxXVxuICAgICAgICApLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJ2YWxzLm1hcCgoaW50ZXJ2YWwsIGluZGV4KSA9PlxuICAgICAgdGhpcy5kYXRlU2VydmljZS5nZXRMYWJlbEZvckludGVydmFsKHRpbWVTZXJpZXNCZWdpbm5pbmcsIGludGVydmFsKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckRhdGFzZXRzKCk6IENoYXJ0RGF0YXNldDwnYmFyJz5bXSB7XG4gICAgaWYgKCF0aGlzLmZlZWRiYWNrU3RhdGlzdGljPy5zZXJpZXMubGVuZ3RoKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZmVlZGJhY2tTdGF0aXN0aWMuc2VyaWVzLm1hcCgoc2VyaWVzKSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBsYWJlbDogc2VyaWVzLmxhYmVsLFxuICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IHNlcmllcy5jb2xvciA/PyB1bmRlZmluZWQsXG4gICAgICAgIGRhdGE6IHRoaXMuZGF0YXNldEluZGV4UmFuZ2UubGVuZ3RoXG4gICAgICAgICAgPyBzZXJpZXMuZGF0YS5zbGljZShcbiAgICAgICAgICAgICAgdGhpcy5kYXRhc2V0SW5kZXhSYW5nZVswXSxcbiAgICAgICAgICAgICAgdGhpcy5kYXRhc2V0SW5kZXhSYW5nZVsxXSArIDFcbiAgICAgICAgICAgIClcbiAgICAgICAgICA6IHNlcmllcy5kYXRhLFxuICAgICAgfTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgZm9ybWF0RGF0ZShkYXRlOiBEYXRlKTogc3RyaW5nIHtcbiAgICByZXR1cm4gaW50bEZvcm1hdChkYXRlLCB7XG4gICAgICBkYXk6ICcyLWRpZ2l0JyxcbiAgICAgIG1vbnRoOiAnMi1kaWdpdCcsXG4gICAgICB5ZWFyOiAnbnVtZXJpYycsXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIHJldHVybkJhc2VDaGFydENvbmZpZygpOiBDaGFydENvbmZpZ3VyYXRpb248J2Jhcic+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2JhcicsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGRhdGFzZXRzOiBbXSxcbiAgICAgIH0sXG4gICAgICBvcHRpb25zOiB7XG4gICAgICAgIHJlc3BvbnNpdmU6IHRydWUsXG4gICAgICAgIHNjYWxlczoge1xuICAgICAgICAgIHk6IHtcbiAgICAgICAgICAgIGJlZ2luQXRaZXJvOiB0cnVlLFxuICAgICAgICAgICAgbWluOiAwLFxuICAgICAgICAgICAgbWF4OiAxMDAsXG4gICAgICAgICAgICB0aXRsZToge1xuICAgICAgICAgICAgICBkaXNwbGF5OiB0cnVlLFxuICAgICAgICAgICAgICB0ZXh0OiB0aGlzLnRyYW5zbGF0aW9uU2VydmljZS5pbnN0YW50KFxuICAgICAgICAgICAgICAgICdDSEFSVFMuRkVFREJBQ0tfU1RBVElTVElDLlJFTEFUSVZFX0ZSRVFVRU5DWSdcbiAgICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB0aWNrczoge1xuICAgICAgICAgICAgICBkaXNwbGF5OiB0cnVlLFxuICAgICAgICAgICAgICBhdXRvU2tpcDogZmFsc2UsXG4gICAgICAgICAgICAgIG1heFRpY2tzTGltaXQ6IDIwLFxuICAgICAgICAgICAgICAvLyBPbmx5IHJlbmRlciBmaXJzdCBhbmQgbGFzdCB0aWNrIHdpdGggcGVyY2VudGFnZSBzaWduXG4gICAgICAgICAgICAgIGNhbGxiYWNrKHZhbHVlLCBpbmRleCwgdGlja3MpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW5kZXggPT09IDAgfHwgaW5kZXggPT09IHRpY2tzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICAgICAgICAgIHZhbHVlID0gVGlja3MuZm9ybWF0dGVycy5udW1lcmljLmFwcGx5KHRoaXMsIFtcbiAgICAgICAgICAgICAgICAgICAgK3ZhbHVlLFxuICAgICAgICAgICAgICAgICAgICBpbmRleCxcbiAgICAgICAgICAgICAgICAgICAgdGlja3MsXG4gICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBgJHt2YWx1ZX0lYDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgeDoge1xuICAgICAgICAgICAgb2Zmc2V0OiB0cnVlLFxuICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSxcbiAgICAgICAgICAgICAgdGV4dDogJycsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cbiIsIjwhLS1cbiAgfiBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiAyMDIzIEhlbG1ob2x0ei1aZW50cnVtIGbDvHIgSW5mZWt0aW9uc2ZvcnNjaHVuZyBHbWJIIChIWkkpIDxQaWFQb3N0QGhlbG1ob2x0ei1oemkuZGU+XG4gIH5cbiAgfiBTUERYLUxpY2Vuc2UtSWRlbnRpZmllcjogQUdQTC0zLjAtb3ItbGF0ZXJcbiAgLS0+XG5cbjxwaWEtY2hhcnQgW2NvbmZpZ109XCJjb25maWdcIj48L3BpYS1jaGFydD5cbiJdfQ==