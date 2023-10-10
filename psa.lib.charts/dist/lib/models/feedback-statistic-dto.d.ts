import { FeedbackStatisticConfigurationDto } from './feedback-statistic-configuration';
import { RelativeFrequencyTimeSeriesDataDto, RelativeFrequencyTimeSeriesDto } from './relative-frequency-time-series-dto';
export declare type FeedbackStatisticStatus = 'has_data' | 'pending' | 'insufficient_data' | 'error';
export declare type FeedbackStatisticDto = RelativeFrequencyTimeSeriesDto;
export declare type FeedbackStatisticTypeDto = FeedbackStatisticConfigurationDto['type'];
export declare type FeedbackStatisticDataDto = RelativeFrequencyTimeSeriesDataDto[];
export interface FeedbackStatisticMetaDataDto {
    configurationId: number;
    title: string;
    description: string;
    status: FeedbackStatisticStatus;
    updatedAt: string | null;
    type: FeedbackStatisticTypeDto;
    data: FeedbackStatisticDataDto | null;
}
