import { ChartFeedbackStatistic } from '../models';
export declare class DataFakerUtility {
    /**
     * Generate an array of random numbers, ranging from 0 to 100
     */
    static generateRandomNumberArray(length: number): number[];
    static generateFeedbackStatistic(start: Date, end: Date, duration: Duration, labels: string[]): ChartFeedbackStatistic;
}
