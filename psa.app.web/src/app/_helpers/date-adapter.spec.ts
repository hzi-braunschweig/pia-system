/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import {
  AppDateAdapter,
  APP_DATE_FORMATS_SHORT,
  APP_DATE_FORMATS_LONG,
} from './date-adapter';
import { DatePipe } from '@angular/common';
import { MAT_DATE_LOCALE } from '@angular/material/core';

describe('AppDateAdapter', () => {
  let dateAdapter: AppDateAdapter;

  describe('with de-DE locale', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          AppDateAdapter,
          DatePipe,
          { provide: MAT_DATE_LOCALE, useValue: 'de-DE' },
        ],
      });

      dateAdapter = TestBed.inject(AppDateAdapter);
    });

    it('should parse a german date correctly', () => {
      const date = dateAdapter.parse('01.03.2021');
      expect(date).toEqual(new Date(2021, 2, 1));
    });

    it('should format a german date correctly with APP_DATE_FORMATS_SHORT', () => {
      const date = new Date(2021, 2, 1);
      const formattedDate = dateAdapter.format(
        date,
        APP_DATE_FORMATS_SHORT.display.dateInput
      );
      expect(formattedDate).toEqual('01.03.21');
    });

    it('should format a german date correctly with APP_DATE_FORMATS_LONG', () => {
      const date = new Date(2021, 2, 1);
      const formattedDate = dateAdapter.format(
        date,
        APP_DATE_FORMATS_LONG.display.dateInput
      );
      expect(formattedDate).toEqual('01.03.2021');
    });
  });

  describe('with en-US locale', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          AppDateAdapter,
          DatePipe,
          { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
        ],
      });

      dateAdapter = TestBed.inject(AppDateAdapter);
    });

    it('should parse an english date correctly', () => {
      const date = dateAdapter.parse('03/01/2021');
      expect(date).toEqual(new Date(2021, 2, 1));
    });

    it('should format an english date correctly with APP_DATE_FORMATS_SHORT', () => {
      const date = new Date(2021, 2, 1);
      const formattedDate = dateAdapter.format(
        date,
        APP_DATE_FORMATS_SHORT.display.dateInput
      );
      expect(formattedDate).toEqual('3/1/21');
    });

    it('should format an english date correctly with APP_DATE_FORMATS_LONG', () => {
      const date = new Date(2021, 2, 1);
      const formattedDate = dateAdapter.format(
        date,
        APP_DATE_FORMATS_LONG.display.dateInput
      );
      expect(formattedDate).toEqual('3/1/2021');
    });
  });
});
