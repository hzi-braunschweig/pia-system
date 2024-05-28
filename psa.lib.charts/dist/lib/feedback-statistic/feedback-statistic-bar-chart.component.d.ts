import { OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartConfiguration } from 'chart.js/auto';
import { ChartFeedbackStatistic } from '../models';
import { DateService } from '../services/date.service';
import * as i0 from "@angular/core";
export declare class FeedbackStatisticBarChartComponent implements OnChanges, OnInit {
    private readonly dateService;
    private readonly translationService;
    feedbackStatistic: ChartFeedbackStatistic | null;
    interval: Interval | null;
    config: ChartConfiguration<'bar'>;
    private labels;
    private dataset;
    private datasetIndexRange;
    constructor(dateService: DateService, translationService: TranslateService);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnInit(): void;
    private updateConfig;
    private setLabels;
    private setDataset;
    private renderLabels;
    private renderDatasets;
    private formatDate;
    private returnBaseChartConfig;
    static ɵfac: i0.ɵɵFactoryDeclaration<FeedbackStatisticBarChartComponent, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FeedbackStatisticBarChartComponent, "pia-feedback-statistic-bar-chart", never, { "feedbackStatistic": { "alias": "feedbackStatistic"; "required": false; }; "interval": { "alias": "interval"; "required": false; }; }, {}, never, never, false, never>;
}
