export declare type TimeSpanUnit = 'hour' | 'day' | 'week' | 'month';
export interface TimeSpanDto {
    amount: number;
    unit: TimeSpanUnit;
}
