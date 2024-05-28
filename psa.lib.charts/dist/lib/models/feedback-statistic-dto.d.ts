import { FeedbackStatisticConfigurationDto } from './feedback-statistic-configuration';
import { RelativeFrequencyTimeSeriesDataDto, RelativeFrequencyTimeSeriesDto } from './relative-frequency-time-series-dto';
export type FeedbackStatisticStatus = 'has_data' | 'pending' | 'insufficient_data' | 'error';
export type FeedbackStatisticDto = RelativeFrequencyTimeSeriesDto;
export type FeedbackStatisticTypeDto = FeedbackStatisticConfigurationDto['type'];
export type FeedbackStatisticDataDto = RelativeFrequencyTimeSeriesDataDto[];
export interface FeedbackStatisticMetaDataDto {
    configurationId: number;
    title: string;
    description: string;
    status: FeedbackStatisticStatus;
    updatedAt: string | null;
    type: FeedbackStatisticTypeDto;
    data: FeedbackStatisticDataDto | null;
}
