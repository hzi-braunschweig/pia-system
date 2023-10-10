import { FeedbackStatisticMetaDataDto } from './feedback-statistic-dto';
import { TimeRangeDto } from './time-range';
export interface RelativeFrequencyTimeSeriesDto extends FeedbackStatisticMetaDataDto {
    type: 'relative_frequency_time_series';
    data: RelativeFrequencyTimeSeriesDataDto[] | null;
}
export interface RelativeFrequencyTimeSeriesDataDto {
    color: string;
    label: string;
    intervals: TimeSeriesIntervalDataDto[];
}
export interface TimeSeriesIntervalDataDto {
    timeRange: TimeRangeDto;
    value: number;
}
