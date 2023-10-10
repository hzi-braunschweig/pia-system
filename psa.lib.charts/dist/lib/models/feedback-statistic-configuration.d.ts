import { TimeSpanDto } from './time-span';
import { TimeRangeDto } from './time-range';
export declare type FeedbackStatisticVisibility = 'hidden' | 'testprobands' | 'allaudiences';
export declare type FeedbackStatisticConfigurationDto = RelativeFrequencyTimeSeriesConfigurationDto;
interface FeedbackStatisticConfigurationMetaDataDto {
    id: number;
    study: string;
    visibility: FeedbackStatisticVisibility;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}
export interface RelativeFrequencyTimeSeriesConfigurationDto extends FeedbackStatisticConfigurationMetaDataDto {
    type: 'relative_frequency_time_series';
    comparativeValues: {
        questionnaire: QuestionnaireReferenceDto;
        answerOptionValueCodes: AnswerOptionValueCodesReferenceDto;
    };
    timeSeries: FeedbackStatisticTimeSeriesDto[];
    intervalShift: TimeSpanDto;
    timeRange: TimeRangeDto;
}
export interface FeedbackStatisticTimeSeriesDto {
    color: string;
    label: string;
    questionnaire: QuestionnaireReferenceDto;
    answerOptionValueCodes: AnswerOptionValueCodesReferenceDto;
}
export interface QuestionnaireReferenceDto {
    id: number;
    version: number;
}
export interface AnswerOptionValueCodesReferenceDto {
    id: number;
    variableName: string | null;
    valueCodes: number[];
}
export {};
