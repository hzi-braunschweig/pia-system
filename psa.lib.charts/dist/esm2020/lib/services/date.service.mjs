/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import { differenceInDays, differenceInMonths, differenceInWeeks, differenceInYears, format, intervalToDuration, } from 'date-fns';
import { Injectable } from '@angular/core';
import * as i0 from "@angular/core";
import * as i1 from "@ngx-translate/core";
export class DateService {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS5zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vcHJvamVjdHMvbGliL3NyYy9saWIvc2VydmljZXMvZGF0ZS5zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7O0dBSUc7QUFFSCxPQUFPLEVBQ0wsZ0JBQWdCLEVBQ2hCLGtCQUFrQixFQUNsQixpQkFBaUIsRUFDakIsaUJBQWlCLEVBRWpCLE1BQU0sRUFDTixrQkFBa0IsR0FDbkIsTUFBTSxVQUFVLENBQUM7QUFDbEIsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQzs7O0FBSTNDLE1BQU0sT0FBTyxXQUFXO0lBQ3RCLFlBQTZCLGdCQUFrQztRQUFsQyxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQWtCO0lBQUcsQ0FBQztJQUU1RCxXQUFXLENBQUMsUUFBZ0I7UUFDakMsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7UUFDOUIsT0FBTyxrQkFBa0IsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzVDLENBQUM7SUFFRDs7T0FFRztJQUNJLGlCQUFpQixDQUFDLFFBQWtCO1FBQ3pDLElBQUksU0FBUyxHQUNYLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztRQUV0RSxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsU0FBUyxHQUFHLFFBQVEsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDO1NBQ2pDO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztJQUVNLG1CQUFtQixDQUN4QixtQkFBeUIsRUFDekIsUUFBZ0I7UUFFaEIsTUFBTSxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxRQUFRLENBQUM7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QUVOLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLFlBQVksSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksSUFBSSxDQUFDO0lBQy9ELENBQUM7O3lHQTVKVSxXQUFXOzZHQUFYLFdBQVcsY0FERSxNQUFNOzRGQUNuQixXQUFXO2tCQUR2QixVQUFVO21CQUFDLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBTUERYLUZpbGVDb3B5cmlnaHRUZXh0OiAyMDIzIEhlbG1ob2x0ei1aZW50cnVtIGbDvHIgSW5mZWt0aW9uc2ZvcnNjaHVuZyBHbWJIIChIWkkpIDxQaWFQb3N0QGhlbG1ob2x0ei1oemkuZGU+XG4gKlxuICogU1BEWC1MaWNlbnNlLUlkZW50aWZpZXI6IEFHUEwtMy4wLW9yLWxhdGVyXG4gKi9cblxuaW1wb3J0IHtcbiAgZGlmZmVyZW5jZUluRGF5cyxcbiAgZGlmZmVyZW5jZUluTW9udGhzLFxuICBkaWZmZXJlbmNlSW5XZWVrcyxcbiAgZGlmZmVyZW5jZUluWWVhcnMsXG4gIER1cmF0aW9uLFxuICBmb3JtYXQsXG4gIGludGVydmFsVG9EdXJhdGlvbixcbn0gZnJvbSAnZGF0ZS1mbnMnO1xuaW1wb3J0IHsgSW5qZWN0YWJsZSB9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHsgVHJhbnNsYXRlU2VydmljZSB9IGZyb20gJ0BuZ3gtdHJhbnNsYXRlL2NvcmUnO1xuXG5ASW5qZWN0YWJsZSh7IHByb3ZpZGVkSW46ICdyb290JyB9KVxuZXhwb3J0IGNsYXNzIERhdGVTZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB0cmFuc2xhdGVTZXJ2aWNlOiBUcmFuc2xhdGVTZXJ2aWNlKSB7fVxuXG4gIHB1YmxpYyBnZXREdXJhdGlvbihpbnRlcnZhbDogRGF0ZVtdKTogRHVyYXRpb24ge1xuICAgIGNvbnN0IFtzdGFydCwgZW5kXSA9IGludGVydmFsO1xuICAgIHJldHVybiBpbnRlcnZhbFRvRHVyYXRpb24oeyBzdGFydCwgZW5kIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdHJ1ZSBpZiBhIGR1cmF0aW9uIGlzIHJlZ3VsYXIsIGUuZy4gaWYgdGhlIGR1cmF0aW9uIGlzIGV4YWN0bHkgMSB1bml0XG4gICAqL1xuICBwdWJsaWMgaXNEdXJhdGlvblJlZ3VsYXIoZHVyYXRpb246IER1cmF0aW9uKTogYm9vbGVhbiB7XG4gICAgbGV0IGlzUmVndWxhciA9XG4gICAgICBPYmplY3QudmFsdWVzKGR1cmF0aW9uKS5maWx0ZXIoKHZhbHVlKSA9PiB2YWx1ZSA9PT0gMSkubGVuZ3RoID09PSAxO1xuXG4gICAgaWYgKCFpc1JlZ3VsYXIpIHtcbiAgICAgIGlzUmVndWxhciA9IGR1cmF0aW9uLmRheXMgPT09IDc7XG4gICAgfVxuXG4gICAgcmV0dXJuIGlzUmVndWxhcjtcbiAgfVxuXG4gIHB1YmxpYyBnZXRMYWJlbEZvckludGVydmFsKFxuICAgIHRpbWVTZXJpZXNCZWdpbm5pbmc6IERhdGUsXG4gICAgaW50ZXJ2YWw6IERhdGVbXVxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IFtzdGFydCwgZW5kXSA9IGludGVydmFsO1xuICAgIGNvbnN0IGR1cmF0aW9uID0gdGhpcy5nZXREdXJhdGlvbihpbnRlcnZhbCk7XG4gICAgY29uc3QgaXNEdXJhdGlvblJlZ3VsYXIgPSB0aGlzLmlzRHVyYXRpb25SZWd1bGFyKGR1cmF0aW9uKTtcblxuICAgIGlmIChkdXJhdGlvbi5ob3Vycykge1xuICAgICAgcmV0dXJuIGZvcm1hdChzdGFydCwgJ2RkLk1NLnl5eXkgSEg6bW0nKSArICcgLSAnICsgZm9ybWF0KGVuZCwgJ0hIOm1tJyk7XG4gICAgfVxuXG4gICAgaWYgKGlzRHVyYXRpb25SZWd1bGFyKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRMYWJlbEZvclJlZ3VsYXJJbnRlcnZhbChcbiAgICAgICAgdGltZVNlcmllc0JlZ2lubmluZyxcbiAgICAgICAgc3RhcnQsXG4gICAgICAgIGR1cmF0aW9uXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5nZXRMYWJlbEZvcklycmVndWxhckludGVydmFsKFxuICAgICAgdGltZVNlcmllc0JlZ2lubmluZyxcbiAgICAgIHN0YXJ0LFxuICAgICAgZHVyYXRpb25cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBnZXRMYWJlbEZvclJlZ3VsYXJJbnRlcnZhbChcbiAgICB0aW1lU2VyaWVzQmVnaW5uaW5nOiBEYXRlLFxuICAgIHN0YXJ0OiBEYXRlLFxuICAgIGR1cmF0aW9uOiBEdXJhdGlvblxuICApIHtcbiAgICBjb25zdCB7IG1vbnRocywgZGF5cywgeWVhcnMsIGhvdXJzIH0gPSBkdXJhdGlvbjtcblxuICAgIGlmIChob3Vycykge1xuICAgICAgcmV0dXJuIGZvcm1hdChzdGFydCwgJ2RkLk1NLnl5eXkgSEg6bW0nKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRleCA9IHRoaXMuZ2V0TGFzdEluZGV4Rm9ySW50ZXJ2YWwoXG4gICAgICB0aW1lU2VyaWVzQmVnaW5uaW5nLFxuICAgICAgc3RhcnQsXG4gICAgICBkdXJhdGlvblxuICAgICk7XG5cbiAgICBpZiAobW9udGhzKSB7XG4gICAgICByZXR1cm4gYCR7dGhpcy50cmFuc2xhdGVTZXJ2aWNlLmluc3RhbnQoXG4gICAgICAgICdDSEFSVFMuRkVFREJBQ0tfU1RBVElTVElDLk1PTlRIJ1xuICAgICAgKX0gJHtpbmRleH1gO1xuICAgIH1cbiAgICBpZiAoZGF5cyA9PT0gMSkge1xuICAgICAgcmV0dXJuIGAke3RoaXMudHJhbnNsYXRlU2VydmljZS5pbnN0YW50KFxuICAgICAgICAnQ0hBUlRTLkZFRURCQUNLX1NUQVRJU1RJQy5EQVknXG4gICAgICApfSAke2luZGV4fWA7XG4gICAgfVxuICAgIGlmIChkYXlzID09PSA3KSB7XG4gICAgICByZXR1cm4gYCR7dGhpcy50cmFuc2xhdGVTZXJ2aWNlLmluc3RhbnQoXG4gICAgICAgICdDSEFSVFMuRkVFREJBQ0tfU1RBVElTVElDLldFRUsnXG4gICAgICApfSAke2luZGV4fWA7XG4gICAgfVxuICAgIGlmICh5ZWFycykge1xuICAgICAgcmV0dXJuIGAke3RoaXMudHJhbnNsYXRlU2VydmljZS5pbnN0YW50KFxuICAgICAgICAnQ0hBUlRTLkZFRURCQUNLX1NUQVRJU1RJQy5ZRUFSJ1xuICAgICAgKX0gJHtpbmRleH1gO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBwcml2YXRlIGdldExhYmVsRm9ySXJyZWd1bGFySW50ZXJ2YWwoXG4gICAgdGltZVNlcmllc0JlZ2lubmluZzogRGF0ZSxcbiAgICBzdGFydDogRGF0ZSxcbiAgICBkdXJhdGlvbjogRHVyYXRpb25cbiAgKTogc3RyaW5nIHtcbiAgICBjb25zdCB7IG1vbnRocywgZGF5cywgeWVhcnMgfSA9IGR1cmF0aW9uO1xuXG4gICAgY29uc3QgbGFzdEluZGV4ID0gdGhpcy5nZXRMYXN0SW5kZXhGb3JJbnRlcnZhbChcbiAgICAgIHRpbWVTZXJpZXNCZWdpbm5pbmcsXG4gICAgICBzdGFydCxcbiAgICAgIGR1cmF0aW9uXG4gICAgKTtcblxuICAgIGlmIChtb250aHMpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLnRyYW5zbGF0ZVNlcnZpY2UuaW5zdGFudChcbiAgICAgICAgJ0NIQVJUUy5GRUVEQkFDS19TVEFUSVNUSUMuTU9OVEhTJ1xuICAgICAgKX0gJHt0aGlzLnJldHVybkluZGV4UmFuZ2VTdHJpbmcobW9udGhzLCBsYXN0SW5kZXgpfWA7XG4gICAgfVxuICAgIGlmIChkYXlzKSB7XG4gICAgICBpZiAoZGF5cyAlIDcgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGAke3RoaXMudHJhbnNsYXRlU2VydmljZS5pbnN0YW50KFxuICAgICAgICAgICdDSEFSVFMuRkVFREJBQ0tfU1RBVElTVElDLldFRUtTJ1xuICAgICAgICApfSAke3RoaXMucmV0dXJuSW5kZXhSYW5nZVN0cmluZyhkYXlzIC8gNywgbGFzdEluZGV4KX1gO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGAke3RoaXMudHJhbnNsYXRlU2VydmljZS5pbnN0YW50KFxuICAgICAgICAnQ0hBUlRTLkZFRURCQUNLX1NUQVRJU1RJQy5EQVlTJ1xuICAgICAgKX0gJHt0aGlzLnJldHVybkluZGV4UmFuZ2VTdHJpbmcoZGF5cywgbGFzdEluZGV4KX1gO1xuICAgIH1cbiAgICBpZiAoeWVhcnMpIHtcbiAgICAgIHJldHVybiBgJHt0aGlzLnRyYW5zbGF0ZVNlcnZpY2UuaW5zdGFudChcbiAgICAgICAgJ0NIQVJUUy5GRUVEQkFDS19TVEFUSVNUSUMuWUVBUlMnXG4gICAgICApfSAke3RoaXMucmV0dXJuSW5kZXhSYW5nZVN0cmluZyh5ZWFycywgbGFzdEluZGV4KX1gO1xuICAgIH1cbiAgICByZXR1cm4gJyc7XG4gIH1cblxuICBwcml2YXRlIHJldHVybkluZGV4UmFuZ2VTdHJpbmcoZHVyYXRpb246IG51bWJlciwgbGFzdEluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIHJldHVybiBgJHtsYXN0SW5kZXggKyAxIC0gZHVyYXRpb259LSR7bGFzdEluZGV4fWA7XG4gIH1cblxuICBwcml2YXRlIGdldExhc3RJbmRleEZvckludGVydmFsKFxuICAgIHRpbWVTZXJpZXNCZWdpbm5pbmc6IERhdGUsXG4gICAgc3RhcnQ6IERhdGUsXG4gICAgZHVyYXRpb246IER1cmF0aW9uXG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgeyBtb250aHMsIGRheXMsIHllYXJzIH0gPSBkdXJhdGlvbjtcbiAgICBpZiAoeWVhcnMpIHtcbiAgICAgIHJldHVybiBkaWZmZXJlbmNlSW5ZZWFycyhzdGFydCwgdGltZVNlcmllc0JlZ2lubmluZykgKyB5ZWFycztcbiAgICB9XG5cbiAgICBpZiAobW9udGhzKSB7XG4gICAgICByZXR1cm4gZGlmZmVyZW5jZUluTW9udGhzKHN0YXJ0LCB0aW1lU2VyaWVzQmVnaW5uaW5nKSArIG1vbnRocztcbiAgICB9XG5cbiAgICBpZiAoZGF5cykge1xuICAgICAgaWYgKGRheXMgJSA3ID09PSAwKSB7XG4gICAgICAgIHJldHVybiBkaWZmZXJlbmNlSW5XZWVrcyhzdGFydCwgdGltZVNlcmllc0JlZ2lubmluZykgKyBkYXlzIC8gNztcbiAgICAgIH1cbiAgICAgIHJldHVybiBkaWZmZXJlbmNlSW5EYXlzKHN0YXJ0LCB0aW1lU2VyaWVzQmVnaW5uaW5nKSArIGRheXM7XG4gICAgfVxuXG4gICAgdGhyb3cgbmV3IEVycm9yKGBVbnN1cHBvcnRlZCBkdXJhdGlvbjogJHtKU09OLnN0cmluZ2lmeShkdXJhdGlvbil9YCk7XG4gIH1cblxuICBwdWJsaWMgaXNJbnRlcnZhbFdpdGhEYXRlT2JqZWN0cyhcbiAgICBwOiBhbnlcbiAgKTogcCBpcyBJbnRlcnZhbCAmIHsgc3RhcnQ6IERhdGU7IGVuZDogRGF0ZSB9IHtcbiAgICByZXR1cm4gcCAmJiBwLnN0YXJ0IGluc3RhbmNlb2YgRGF0ZSAmJiBwLmVuZCBpbnN0YW5jZW9mIERhdGU7XG4gIH1cbn1cbiJdfQ==