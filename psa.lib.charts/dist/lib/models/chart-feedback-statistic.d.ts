export interface ChartFeedbackSeries {
    label: string;
    color: string;
    data: number[];
}
export interface ChartFeedbackStatistic {
    intervals: Date[][];
    series: ChartFeedbackSeries[];
}
