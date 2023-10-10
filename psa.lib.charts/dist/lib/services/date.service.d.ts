import { Duration } from 'date-fns';
import { TranslateService } from '@ngx-translate/core';
import * as i0 from "@angular/core";
export declare class DateService {
    private readonly translateService;
    constructor(translateService: TranslateService);
    getDuration(interval: Date[]): Duration;
    /**
     * Returns true if a duration is regular, e.g. if the duration is exactly 1 unit
     */
    isDurationRegular(duration: Duration): boolean;
    getLabelForInterval(timeSeriesBeginning: Date, interval: Date[]): string;
    private getLabelForRegularInterval;
    private getLabelForIrregularInterval;
    private returnIndexRangeString;
    private getLastIndexForInterval;
    isIntervalWithDateObjects(p: any): p is Interval & {
        start: Date;
        end: Date;
    };
    static ɵfac: i0.ɵɵFactoryDeclaration<DateService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<DateService>;
}
