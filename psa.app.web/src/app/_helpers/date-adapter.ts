import { NativeDateAdapter } from '@angular/material/core';
import { DatePipe } from '@angular/common';
import { Injectable } from '@angular/core';

@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: any): string {
    if (displayFormat === 'customInput') {
      return new DatePipe(this.locale).transform(date, 'shortDate');
    } else {
      return new DatePipe(this.locale).transform(date, 'MMM yyyy');
    }
  }
}

export const APP_DATE_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
  },

  display: {
    dateInput: 'customInput',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
