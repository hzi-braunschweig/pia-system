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
}
FeedbackStatisticBarChartComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: FeedbackStatisticBarChartComponent, deps: [{ token: i1.DateService }, { token: i2.TranslateService }], target: i0.ɵɵFactoryTarget.Component });
FeedbackStatisticBarChartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.12", type: FeedbackStatisticBarChartComponent, selector: "pia-feedback-statistic-bar-chart", inputs: { feedbackStatistic: "feedbackStatistic", interval: "interval" }, usesOnChanges: true, ngImport: i0, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<pia-chart [config]=\"config\"></pia-chart>\n", styles: [":host{display:block}mat-slider{display:block;margin:0 auto;width:80%}\n"], dependencies: [{ kind: "component", type: i3.ChartComponent, selector: "pia-chart", inputs: ["config"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: FeedbackStatisticBarChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pia-feedback-statistic-bar-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<pia-chart [config]=\"config\"></pia-chart>\n", styles: [":host{display:block}mat-slider{display:block;margin:0 auto;width:80%}\n"] }]
        }], ctorParameters: function () { return [{ type: i1.DateService }, { type: i2.TranslateService }]; }, propDecorators: { feedbackStatistic: [{
                type: Input
            }], interval: [{
                type: Input
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9saWIvc3JjL2xpYi9mZWVkYmFjay1zdGF0aXN0aWMvZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQudHMiLCIuLi8uLi8uLi8uLi9wcm9qZWN0cy9saWIvc3JjL2xpYi9mZWVkYmFjay1zdGF0aXN0aWMvZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQuaHRtbCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7OztHQUlHO0FBRUgsT0FBTyxFQUNMLHVCQUF1QixFQUN2QixTQUFTLEVBQ1QsS0FBSyxHQUlOLE1BQU0sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBZ0IsS0FBSyxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBRS9DLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxVQUFVLENBQUM7Ozs7O0FBVXRDLE1BQU0sT0FBTyxrQ0FBa0M7SUFVN0MsWUFDbUIsV0FBd0IsRUFDeEIsa0JBQW9DO1FBRHBDLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBQ3hCLHVCQUFrQixHQUFsQixrQkFBa0IsQ0FBa0I7UUFYdkMsc0JBQWlCLEdBQWtDLElBQUksQ0FBQztRQUN4RCxhQUFRLEdBQW9CLElBQUksQ0FBQztRQUUxQyxXQUFNLEdBQThCLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBRWhFLFdBQU0sR0FBYSxFQUFFLENBQUM7UUFDdEIsWUFBTyxHQUEwQixFQUFFLENBQUM7UUFDcEMsc0JBQWlCLEdBQWEsRUFBRSxDQUFDO0lBS3RDLENBQUM7SUFFRyxXQUFXLENBQUMsT0FBc0I7UUFDdkMsSUFBSSxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDdkQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMscUJB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LENBQUM7eUJBQ0Y7cUJBQ0Y7b0JBQ0QsQ0FBQyxFQUFFO3dCQUNELE1BQU0sRUFBRSxJQUFJO3dCQUNaLEtBQUssRUFBRTs0QkFDTCxPQUFPLEVBQUUsSUFBSTs0QkFDYixJQUFJLEVBQUUsRUFBRTt5QkFDVDtxQkFDRjtpQkFDRjthQUNGO1NBQ0YsQ0FBQztJQUNKLENBQUM7O2dJQXBKVSxrQ0FBa0M7b0hBQWxDLGtDQUFrQyx1S0MzQi9DLDBPQU9BOzRGRG9CYSxrQ0FBa0M7a0JBTjlDLFNBQVM7K0JBQ0Usa0NBQWtDLG1CQUczQix1QkFBdUIsQ0FBQyxNQUFNO2lJQUcvQixpQkFBaUI7c0JBQWhDLEtBQUs7Z0JBQ1UsUUFBUTtzQkFBdkIsS0FBSyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiAyMDIzIEhlbG1ob2x0ei1aZW50cnVtIGbDvHIgSW5mZWt0aW9uc2ZvcnNjaHVuZyBHbWJIIChIWkkpIDxQaWFQb3N0QGhlbG1ob2x0ei1oemkuZGU+XG4gKlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4gKi9cblxuaW1wb3J0IHtcbiAgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3ksXG4gIENvbXBvbmVudCxcbiAgSW5wdXQsXG4gIE9uQ2hhbmdlcyxcbiAgT25Jbml0LFxuICBTaW1wbGVDaGFuZ2VzLFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFRyYW5zbGF0ZVNlcnZpY2UgfSBmcm9tICdAbmd4LXRyYW5zbGF0ZS9jb3JlJztcbmltcG9ydCB7IENoYXJ0RGF0YXNldCwgVGlja3MgfSBmcm9tICdjaGFydC5qcyc7XG5pbXBvcnQgeyBDaGFydENvbmZpZ3VyYXRpb24gfSBmcm9tICdjaGFydC5qcy9hdXRvJztcbmltcG9ydCB7IGludGxGb3JtYXQgfSBmcm9tICdkYXRlLWZucyc7XG5pbXBvcnQgeyBDaGFydEZlZWRiYWNrU3RhdGlzdGljIH0gZnJvbSAnLi4vbW9kZWxzJztcbmltcG9ydCB7IERhdGVTZXJ2aWNlIH0gZnJvbSAnLi4vc2VydmljZXMvZGF0ZS5zZXJ2aWNlJztcblxuQENvbXBvbmVudCh7XG4gIHNlbGVjdG9yOiAncGlhLWZlZWRiYWNrLXN0YXRpc3RpYy1iYXItY2hhcnQnLFxuICB0ZW1wbGF0ZVVybDogJy4vZmVlZGJhY2stc3RhdGlzdGljLWJhci1jaGFydC5jb21wb25lbnQuaHRtbCcsXG4gIHN0eWxlVXJsczogWycuL2ZlZWRiYWNrLXN0YXRpc3RpYy1iYXItY2hhcnQuY29tcG9uZW50LmNzcyddLFxuICBjaGFuZ2VEZXRlY3Rpb246IENoYW5nZURldGVjdGlvblN0cmF0ZWd5Lk9uUHVzaCxcbn0pXG5leHBvcnQgY2xhc3MgRmVlZGJhY2tTdGF0aXN0aWNCYXJDaGFydENvbXBvbmVudCBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgT25Jbml0IHtcbiAgQElucHV0KCkgcHVibGljIGZlZWRiYWNrU3RhdGlzdGljOiBDaGFydEZlZWRiYWNrU3RhdGlzdGljIHwgbnVsbCA9IG51bGw7XG4gIEBJbnB1dCgpIHB1YmxpYyBpbnRlcnZhbDogSW50ZXJ2YWwgfCBudWxsID0gbnVsbDtcblxuICBwdWJsaWMgY29uZmlnOiBDaGFydENvbmZpZ3VyYXRpb248J2Jhcic+ID0gdGhpcy5yZXR1cm5CYXNlQ2hhcnRDb25maWcoKTtcblxuICBwcml2YXRlIGxhYmVsczogc3RyaW5nW10gPSBbXTtcbiAgcHJpdmF0ZSBkYXRhc2V0OiBDaGFydERhdGFzZXQ8J2Jhcic+W10gPSBbXTtcbiAgcHJpdmF0ZSBkYXRhc2V0SW5kZXhSYW5nZTogbnVtYmVyW10gPSBbXTtcblxuICBwdWJsaWMgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSBkYXRlU2VydmljZTogRGF0ZVNlcnZpY2UsXG4gICAgcHJpdmF0ZSByZWFkb25seSB0cmFuc2xhdGlvblNlcnZpY2U6IFRyYW5zbGF0ZVNlcnZpY2VcbiAgKSB7fVxuXG4gIHB1YmxpYyBuZ09uQ2hhbmdlcyhjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogdm9pZCB7XG4gICAgaWYgKGNoYW5nZXNbJ2ZlZWRiYWNrU3RhdGlzdGljJ10gfHwgY2hhbmdlc1snaW50ZXJ2YWwnXSkge1xuICAgICAgdGhpcy5jb25maWcgPSB0aGlzLnJldHVybkJhc2VDaGFydENvbmZpZygpO1xuICAgICAgdGhpcy51cGRhdGVDb25maWcoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgbmdPbkluaXQoKTogdm9pZCB7XG4gICAgdGhpcy51cGRhdGVDb25maWcoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlQ29uZmlnKCk6IHZvaWQge1xuICAgIHRoaXMuc2V0TGFiZWxzKCk7XG4gICAgdGhpcy5zZXREYXRhc2V0KCk7XG5cbiAgICB0aGlzLmNvbmZpZyA9IHtcbiAgICAgIC4uLnRoaXMuY29uZmlnLFxuICAgICAgZGF0YToge1xuICAgICAgICBsYWJlbHM6IHRoaXMubGFiZWxzLFxuICAgICAgICBkYXRhc2V0czogdGhpcy5kYXRhc2V0LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgcHJpdmF0ZSBzZXRMYWJlbHMoKSB7XG4gICAgdGhpcy5sYWJlbHMgPSB0aGlzLnJlbmRlckxhYmVscygpO1xuICB9XG5cbiAgcHJpdmF0ZSBzZXREYXRhc2V0KCkge1xuICAgIHRoaXMuZGF0YXNldCA9IHRoaXMucmVuZGVyRGF0YXNldHMoKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTGFiZWxzKCk6IHN0cmluZ1tdIHtcbiAgICBpZiAoIXRoaXMuZmVlZGJhY2tTdGF0aXN0aWM/LmludGVydmFscy5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCB0aW1lU2VyaWVzQmVnaW5uaW5nID0gdGhpcy5mZWVkYmFja1N0YXRpc3RpYy5pbnRlcnZhbHNbMF1bMF07XG4gICAgbGV0IGludGVydmFsczogRGF0ZVtdW10gPSBbLi4udGhpcy5mZWVkYmFja1N0YXRpc3RpYy5pbnRlcnZhbHNdO1xuXG4gICAgaWYgKHRoaXMuZGF0ZVNlcnZpY2UuaXNJbnRlcnZhbFdpdGhEYXRlT2JqZWN0cyh0aGlzLmludGVydmFsKSkge1xuICAgICAgY29uc3QgeyBzdGFydCwgZW5kIH0gPSB0aGlzLmludGVydmFsO1xuXG4gICAgICBpbnRlcnZhbHMgPSBpbnRlcnZhbHMuZmlsdGVyKChpKSA9PiBpWzBdID49IHN0YXJ0ICYmIGlbMV0gPD0gZW5kKTtcblxuICAgICAgdGhpcy5kYXRhc2V0SW5kZXhSYW5nZSA9IFtcbiAgICAgICAgdGhpcy5mZWVkYmFja1N0YXRpc3RpYy5pbnRlcnZhbHMuaW5kZXhPZihpbnRlcnZhbHNbMF0pLFxuICAgICAgICB0aGlzLmZlZWRiYWNrU3RhdGlzdGljLmludGVydmFscy5pbmRleE9mKFxuICAgICAgICAgIGludGVydmFsc1tpbnRlcnZhbHMubGVuZ3RoIC0gMV1cbiAgICAgICAgKSxcbiAgICAgIF07XG4gICAgfVxuXG4gICAgcmV0dXJuIGludGVydmFscy5tYXAoKGludGVydmFsLCBpbmRleCkgPT5cbiAgICAgIHRoaXMuZGF0ZVNlcnZpY2UuZ2V0TGFiZWxGb3JJbnRlcnZhbCh0aW1lU2VyaWVzQmVnaW5uaW5nLCBpbnRlcnZhbClcbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJEYXRhc2V0cygpOiBDaGFydERhdGFzZXQ8J2Jhcic+W10ge1xuICAgIGlmICghdGhpcy5mZWVkYmFja1N0YXRpc3RpYz8uc2VyaWVzLmxlbmd0aCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmZlZWRiYWNrU3RhdGlzdGljLnNlcmllcy5tYXAoKHNlcmllcykgPT4ge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbGFiZWw6IHNlcmllcy5sYWJlbCxcbiAgICAgICAgYmFja2dyb3VuZENvbG9yOiBzZXJpZXMuY29sb3IgPz8gdW5kZWZpbmVkLFxuICAgICAgICBkYXRhOiB0aGlzLmRhdGFzZXRJbmRleFJhbmdlLmxlbmd0aFxuICAgICAgICAgID8gc2VyaWVzLmRhdGEuc2xpY2UoXG4gICAgICAgICAgICAgIHRoaXMuZGF0YXNldEluZGV4UmFuZ2VbMF0sXG4gICAgICAgICAgICAgIHRoaXMuZGF0YXNldEluZGV4UmFuZ2VbMV0gKyAxXG4gICAgICAgICAgICApXG4gICAgICAgICAgOiBzZXJpZXMuZGF0YSxcbiAgICAgIH07XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGZvcm1hdERhdGUoZGF0ZTogRGF0ZSk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGludGxGb3JtYXQoZGF0ZSwge1xuICAgICAgZGF5OiAnMi1kaWdpdCcsXG4gICAgICBtb250aDogJzItZGlnaXQnLFxuICAgICAgeWVhcjogJ251bWVyaWMnLFxuICAgIH0pO1xuICB9XG5cbiAgcHJpdmF0ZSByZXR1cm5CYXNlQ2hhcnRDb25maWcoKTogQ2hhcnRDb25maWd1cmF0aW9uPCdiYXInPiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdiYXInLFxuICAgICAgZGF0YToge1xuICAgICAgICBkYXRhc2V0czogW10sXG4gICAgICB9LFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICByZXNwb25zaXZlOiB0cnVlLFxuICAgICAgICBzY2FsZXM6IHtcbiAgICAgICAgICB5OiB7XG4gICAgICAgICAgICBiZWdpbkF0WmVybzogdHJ1ZSxcbiAgICAgICAgICAgIG1pbjogMCxcbiAgICAgICAgICAgIG1heDogMTAwLFxuICAgICAgICAgICAgdGl0bGU6IHtcbiAgICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSxcbiAgICAgICAgICAgICAgdGV4dDogdGhpcy50cmFuc2xhdGlvblNlcnZpY2UuaW5zdGFudChcbiAgICAgICAgICAgICAgICAnQ0hBUlRTLkZFRURCQUNLX1NUQVRJU1RJQy5SRUxBVElWRV9GUkVRVUVOQ1knXG4gICAgICAgICAgICAgICksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgdGlja3M6IHtcbiAgICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSxcbiAgICAgICAgICAgICAgYXV0b1NraXA6IGZhbHNlLFxuICAgICAgICAgICAgICBtYXhUaWNrc0xpbWl0OiAyMCxcbiAgICAgICAgICAgICAgLy8gT25seSByZW5kZXIgZmlyc3QgYW5kIGxhc3QgdGljayB3aXRoIHBlcmNlbnRhZ2Ugc2lnblxuICAgICAgICAgICAgICBjYWxsYmFjayh2YWx1ZSwgaW5kZXgsIHRpY2tzKSB7XG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09PSAwIHx8IGluZGV4ID09PSB0aWNrcy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgICB2YWx1ZSA9IFRpY2tzLmZvcm1hdHRlcnMubnVtZXJpYy5hcHBseSh0aGlzLCBbXG4gICAgICAgICAgICAgICAgICAgICt2YWx1ZSxcbiAgICAgICAgICAgICAgICAgICAgaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIHRpY2tzLFxuICAgICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gYCR7dmFsdWV9JWA7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHg6IHtcbiAgICAgICAgICAgIG9mZnNldDogdHJ1ZSxcbiAgICAgICAgICAgIHRpdGxlOiB7XG4gICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsXG4gICAgICAgICAgICAgIHRleHQ6ICcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG4iLCI8IS0tXG4gIH4gU1BEWC1GaWxlQ29weXJpZ2h0VGV4dDogMjAyMyBIZWxtaG9sdHotWmVudHJ1bSBmw7xyIEluZmVrdGlvbnNmb3JzY2h1bmcgR21iSCAoSFpJKSA8UGlhUG9zdEBoZWxtaG9sdHotaHppLmRlPlxuICB+XG4gIH4gU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4gIC0tPlxuXG48cGlhLWNoYXJ0IFtjb25maWddPVwiY29uZmlnXCI+PC9waWEtY2hhcnQ+XG4iXX0=