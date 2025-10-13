/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { NativeDateAdapter } from '@angular/material/core';
import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';

@Injectable()
export class AppDateAdapter extends NativeDateAdapter {
  format(
    date: Date,
    displayFormat: string | { matcher: RegExp; format: string }[]
  ): string {
    const format = this.resolveFormat(displayFormat);

    return new DatePipe(this.locale).transform(date, format);
  }

  parse(value: unknown): Date | null {
    if (typeof value === 'string') {
      if (this.locale.match(/de/i)) {
        return this.parseGermanDate(value);
      }
      if (this.locale.match(/(fr|es)/i)) {
        return this.parseFrenchOrSpanishDate(value);
      }
    }

    return super.parse(value);
  }

  private parseFrenchOrSpanishDate(value: string): Date | null {
    const parts = value.split('/');
    if (parts.length < 3) {
      return null;
    }
    const day = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);
    return new Date(year, month, day);
  }

  private parseGermanDate(value: string): Date | null {
    const str = value.split('.');

    if (str.length < 3) {
      return null;
    }

    const day = Number(str[0]);
    const month = Number(str[1]) - 1;
    const year = Number(str[2]);

    return new Date(year, month, day);
  }

  private resolveFormat(
    displayFormat: string | { matcher: RegExp; format: string }[]
  ): string {
    if (Array.isArray(displayFormat)) {
      for (const format of displayFormat) {
        if (format.matcher === null || format.matcher.test(this.locale)) {
          return format.format;
        }
      }
    }

    return typeof displayFormat === 'string' ? displayFormat : 'MMM yyyy';
  }
}

export const APP_DATE_FORMATS_SHORT = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
  },

  display: {
    dateInput: 'shortDate',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

export const APP_DATE_FORMATS_LONG = {
  ...APP_DATE_FORMATS_SHORT,
  display: {
    ...APP_DATE_FORMATS_SHORT.display,
    dateInput: [
      { matcher: /de/, format: 'dd.MM.yyyy' },
      { matcher: /(fr)|(es)/, format: 'dd/MM/yyyy' },
      { matcher: null, format: 'M/d/yyyy' },
    ],
  },
};
