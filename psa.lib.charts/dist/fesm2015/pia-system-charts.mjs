import * as i0 from '@angular/core';
import { InjectionToken, ElementRef, Component, ChangeDetectionStrategy, Inject, Input, ViewChild, Injectable, NgModule } from '@angular/core';
import * as i1 from '@ngx-translate/core';
import { TranslateModule } from '@ngx-translate/core';
import { Chart } from 'chart.js/auto';
import { Ticks } from 'chart.js';
import { intervalToDuration, format, differenceInYears, differenceInMonths, differenceInWeeks, differenceInDays, intlFormat, add } from 'date-fns';

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
const PIA_CHARTS_CONFIGURATION = new InjectionToken('PIA_CHARTS_CONFIGURATION');

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
const defaultConfiguration = {
    legend: {
        position: 'bottom',
        align: 'center',
    },
    tooltip: {
        enabled: false,
    },
};

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class ColorPaletteUtility {
    static getColorForIterator(index) {
        return this.colors[index % this.colors.length];
    }
}
ColorPaletteUtility.colors = [
    '#668F31',
    '#8FB744',
    '#ADCF67',
    '#CCE697',
    '#2E90C1',
    '#3AA9E0',
    '#84C7E8',
    '#A9DAF3',
];

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class ChartComponent {
    constructor(globalConfig) {
        this.globalConfig = globalConfig;
        this.chart = null;
        this.canvas = null;
    }
    ngOnChanges(changes) {
        if (this.chart !== null) {
            this.prepareChartConfiguration();
            this.chart.data = this.config.data;
            this.chart.update();
        }
    }
    ngAfterViewInit() {
        var _a;
        this.prepareChartConfiguration();
        this.chart = new Chart((_a = this.canvas) === null || _a === void 0 ? void 0 : _a.nativeElement, this.config);
    }
    prepareChartConfiguration() {
        this.applyColorsToDataSets();
        this.applyPluginConfigurations();
        this.applyResponsiveConfiguration();
    }
    applyColorsToDataSets() {
        if (this.config.data.datasets.length === 0) {
            return;
        }
        let transformer;
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
        this.config.data.datasets = this.config.data.datasets.map((dataset, index) => 
        // don't override colors
        dataset.backgroundColor ? dataset : transformer(dataset, index));
    }
    applyPluginConfigurations() {
        if (this.globalConfig.legend) {
            this.configurePlugin('legend', this.globalConfig.legend);
        }
        if (this.globalConfig.tooltip) {
            this.configurePlugin('tooltip', this.globalConfig.tooltip);
        }
    }
    applyResponsiveConfiguration() {
        this.config = Object.assign(Object.assign({}, this.config), { options: Object.assign(Object.assign({}, this.config.options), { maintainAspectRatio: false }) });
    }
    configurePlugin(key, pluginConfig) {
        var _a, _b;
        this.config = Object.assign(Object.assign({}, this.config), { options: Object.assign(Object.assign({}, this.config.options), { plugins: Object.assign(Object.assign({}, (((_a = this.config.options) === null || _a === void 0 ? void 0 : _a.plugins) ? this.config.options.plugins : {})), { [key]: Object.assign(Object.assign({}, (typeof ((_b = this.config.options) === null || _b === void 0 ? void 0 : _b.plugins) === 'object' &&
                        key in this.config.options.plugins
                        ? this.config.options.plugins[key]
                        : {})), pluginConfig) }) }) });
    }
}
ChartComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartComponent, deps: [{ token: PIA_CHARTS_CONFIGURATION }], target: i0.ɵɵFactoryTarget.Component });
ChartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.12", type: ChartComponent, selector: "pia-chart", inputs: { config: "config" }, viewQueries: [{ propertyName: "canvas", first: true, predicate: ["canvas"], descendants: true, read: ElementRef }], usesOnChanges: true, ngImport: i0, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<canvas #canvas></canvas>\n", styles: [":host{display:block;width:100%;height:100%;position:relative;overflow:auto}\n"], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: ChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pia-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<canvas #canvas></canvas>\n", styles: [":host{display:block;width:100%;height:100%;position:relative;overflow:auto}\n"] }]
        }], ctorParameters: function () {
        return [{ type: undefined, decorators: [{
                        type: Inject,
                        args: [PIA_CHARTS_CONFIGURATION]
                    }] }];
    }, propDecorators: { config: [{
                type: Input
            }], canvas: [{
                type: ViewChild,
                args: ['canvas', { read: ElementRef }]
            }] } });

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class DateService {
    constructor(translateService) {
        this.translateService = translateService;
    }
    getDuration(interval) {
        const [start, end] = interval;
        return intervalToDuration({ start, end });
    }
    /**
     * Returns true if a duration is regular, e.g. if the duration is exactly 1 unit
     */
    isDurationRegular(duration) {
        let isRegular = Object.values(duration).filter((value) => value === 1).length === 1;
        if (!isRegular) {
            isRegular = duration.days === 7;
        }
        return isRegular;
    }
    getLabelForInterval(timeSeriesBeginning, interval) {
        const [start, end] = interval;
        const duration = this.getDuration(interval);
        const isDurationRegular = this.isDurationRegular(duration);
        if (duration.hours) {
            return format(start, 'dd.MM.yyyy HH:mm') + ' - ' + format(end, 'HH:mm');
        }
        if (isDurationRegular) {
            return this.getLabelForRegularInterval(timeSeriesBeginning, start, duration);
        }
        return this.getLabelForIrregularInterval(timeSeriesBeginning, start, duration);
    }
    getLabelForRegularInterval(timeSeriesBeginning, start, duration) {
        const { months, days, years, hours } = duration;
        if (hours) {
            return format(start, 'dd.MM.yyyy HH:mm');
        }
        const index = this.getLastIndexForInterval(timeSeriesBeginning, start, duration);
        if (months) {
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.MONTH')} ${index}`;
        }
        if (days === 1) {
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.DAY')} ${index}`;
        }
        if (days === 7) {
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.WEEK')} ${index}`;
        }
        if (years) {
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.YEAR')} ${index}`;
        }
        return '';
    }
    getLabelForIrregularInterval(timeSeriesBeginning, start, duration) {
        const { months, days, years } = duration;
        const lastIndex = this.getLastIndexForInterval(timeSeriesBeginning, start, duration);
        if (months) {
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.MONTHS')} ${this.returnIndexRangeString(months, lastIndex)}`;
        }
        if (days) {
            if (days % 7 === 0) {
                return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.WEEKS')} ${this.returnIndexRangeString(days / 7, lastIndex)}`;
            }
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.DAYS')} ${this.returnIndexRangeString(days, lastIndex)}`;
        }
        if (years) {
            return `${this.translateService.instant('CHARTS.FEEDBACK_STATISTIC.YEARS')} ${this.returnIndexRangeString(years, lastIndex)}`;
        }
        return '';
    }
    returnIndexRangeString(duration, lastIndex) {
        return `${lastIndex + 1 - duration}-${lastIndex}`;
    }
    getLastIndexForInterval(timeSeriesBeginning, start, duration) {
        const { months, days, years } = duration;
        if (years) {
            return differenceInYears(start, timeSeriesBeginning) + years;
        }
        if (months) {
            return differenceInMonths(start, timeSeriesBeginning) + months;
        }
        if (days) {
            if (days % 7 === 0) {
                return differenceInWeeks(start, timeSeriesBeginning) + days / 7;
            }
            return differenceInDays(start, timeSeriesBeginning) + days;
        }
        throw new Error(`Unsupported duration: ${JSON.stringify(duration)}`);
    }
    isIntervalWithDateObjects(p) {
        return p && p.start instanceof Date && p.end instanceof Date;
    }
}
DateService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: DateService, deps: [{ token: i1.TranslateService }], target: i0.ɵɵFactoryTarget.Injectable });
DateService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: DateService, providedIn: 'root' });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: DateService, decorators: [{
            type: Injectable,
            args: [{ providedIn: 'root' }]
        }], ctorParameters: function () { return [{ type: i1.TranslateService }]; } });

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class FeedbackStatisticBarChartComponent {
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
        this.config = Object.assign(Object.assign({}, this.config), { data: {
                labels: this.labels,
                datasets: this.dataset,
            } });
    }
    setLabels() {
        this.labels = this.renderLabels();
    }
    setDataset() {
        this.dataset = this.renderDatasets();
    }
    renderLabels() {
        var _a;
        if (!((_a = this.feedbackStatistic) === null || _a === void 0 ? void 0 : _a.intervals.length)) {
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
        var _a;
        if (!((_a = this.feedbackStatistic) === null || _a === void 0 ? void 0 : _a.series.length)) {
            return [];
        }
        return this.feedbackStatistic.series.map((series) => {
            var _a;
            return {
                label: series.label,
                backgroundColor: (_a = series.color) !== null && _a !== void 0 ? _a : undefined,
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
FeedbackStatisticBarChartComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: FeedbackStatisticBarChartComponent, deps: [{ token: DateService }, { token: i1.TranslateService }], target: i0.ɵɵFactoryTarget.Component });
FeedbackStatisticBarChartComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "14.2.12", type: FeedbackStatisticBarChartComponent, selector: "pia-feedback-statistic-bar-chart", inputs: { feedbackStatistic: "feedbackStatistic", interval: "interval" }, usesOnChanges: true, ngImport: i0, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<pia-chart [config]=\"config\"></pia-chart>\n", styles: [":host{display:block}mat-slider{display:block;margin:0 auto;width:80%}\n"], dependencies: [{ kind: "component", type: ChartComponent, selector: "pia-chart", inputs: ["config"] }], changeDetection: i0.ChangeDetectionStrategy.OnPush });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.12", ngImport: i0, type: FeedbackStatisticBarChartComponent, decorators: [{
            type: Component,
            args: [{ selector: 'pia-feedback-statistic-bar-chart', changeDetection: ChangeDetectionStrategy.OnPush, template: "<!--\n  ~ SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum f\u00FCr Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>\n  ~\n  ~ SPDX-License-Identifier: AGPL-3.0-or-later\n  -->\n\n<pia-chart [config]=\"config\"></pia-chart>\n", styles: [":host{display:block}mat-slider{display:block;margin:0 auto;width:80%}\n"] }]
        }], ctorParameters: function () { return [{ type: DateService }, { type: i1.TranslateService }]; }, propDecorators: { feedbackStatistic: [{
                type: Input
            }], interval: [{
                type: Input
            }] } });

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class ChartsModule {
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
                    useValue: config !== null && config !== void 0 ? config : defaultConfiguration,
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

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class DataFakerUtility {
    /**
     * Generate an array of random numbers, ranging from 0 to 100
     */
    static generateRandomNumberArray(length) {
        const result = [];
        for (let i = 0; i < length; i++) {
            result.push(Math.random() * 100);
        }
        return result;
    }
    static generateFeedbackStatistic(start, end, duration, labels) {
        const intervals = [];
        for (let date = start; date <= end; date = add(date, duration)) {
            intervals.push([date, add(date, duration)]);
        }
        intervals.pop();
        const series = labels.map((label, i) => ({
            label,
            color: ColorPaletteUtility.getColorForIterator(i),
            data: this.generateRandomNumberArray(intervals.length),
        }));
        return {
            intervals,
            series,
        };
    }
}

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
class FeedbackStatisticMapperUtility {
    static map(dto) {
        if (!dto || !dto.data || dto.data.length === 0) {
            return null;
        }
        const intervals = dto.data[0].intervals.map((interval) => {
            var _a, _b;
            return [
                new Date((_a = interval.timeRange.startDate) !== null && _a !== void 0 ? _a : 0),
                new Date((_b = interval.timeRange.endDate) !== null && _b !== void 0 ? _b : 0),
            ];
        });
        const series = dto.data.map((data) => {
            return {
                label: data.label,
                color: data.color,
                data: data.intervals.map((interval) => interval.value),
            };
        });
        return {
            intervals,
            series,
        };
    }
}

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * Generated bundle index. Do not edit.
 */

export { ChartComponent, ChartsModule, ColorPaletteUtility, DataFakerUtility, FeedbackStatisticBarChartComponent, FeedbackStatisticMapperUtility };
//# sourceMappingURL=pia-system-charts.mjs.map
