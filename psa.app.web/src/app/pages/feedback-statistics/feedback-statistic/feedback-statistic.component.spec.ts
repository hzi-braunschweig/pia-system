/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';

import {
  FeedbackStatisticComponent,
  RangeValueObject,
} from './feedback-statistic.component';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { FeedbackStatisticBarChartComponent } from '@pia-system/charts';
import { MarkdownPipe } from 'ngx-markdown';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { createFakeFeedbackStatisticDto } from '../create-fake-feedback-statistic-dto.spec';
import SpyObj = jasmine.SpyObj;
import { CurrentUser } from '../../../_services/current-user.service';
import { add } from 'date-fns';

const startDate = new Date('2023-01-01T00:00:00.000Z');

describe('FeedbackStatisticComponent', () => {
  let component: FeedbackStatisticComponent;
  let fixture: ComponentFixture<FeedbackStatisticComponent>;

  let currentUser: SpyObj<CurrentUser>;

  beforeEach(async () => {
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      locale: 'en-US',
    });

    await TestBed.configureTestingModule({
      declarations: [
        FeedbackStatisticComponent,
        MockComponent(FeedbackStatisticBarChartComponent),
        MockPipe(MarkdownPipe),
        MockPipe(TranslatePipe),
      ],
      imports: [MatCardModule, MatButtonModule, MatIconModule],
      providers: [MockProvider(CurrentUser, currentUser)],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticComponent);
    component = fixture.componentInstance;
    component.feedbackStatisticDto = createFakeFeedbackStatisticDto();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('range selection for chart', () => {
    const testCases: {
      select: RangeValueObject;
      expect: { rangeSelection: RangeValueObject; interval: Interval };
    }[] = [
      {
        select: {
          lower: 2,
          upper: 9,
        },
        expect: {
          rangeSelection: {
            lower: 2,
            upper: 9,
          },
          interval: {
            start: add(startDate, { weeks: 1 }),
            end: add(startDate, { weeks: 8 }),
          },
        },
      },
      {
        select: {
          lower: 1,
          upper: 2,
        },
        expect: {
          rangeSelection: {
            lower: 1,
            upper: 2,
          },
          interval: {
            start: add(startDate, { weeks: 0 }),
            end: add(startDate, { weeks: 1 }),
          },
        },
      },
      {
        select: {
          lower: 11,
          upper: 11,
        },
        expect: {
          rangeSelection: {
            lower: 11,
            upper: 11,
          },
          interval: {
            start: add(startDate, { weeks: 10 }),
            end: add(startDate, { weeks: 10 }),
          },
        },
      },
      {
        select: {
          lower: 1,
          upper: 1,
        },
        expect: {
          rangeSelection: {
            lower: 1,
            upper: 1,
          },
          interval: {
            start: add(startDate, { weeks: 0 }),
            end: add(startDate, { weeks: 0 }),
          },
        },
      },
    ];

    for (const testCase of testCases) {
      it(`should select the range ${JSON.stringify(
        testCase.select
      )} => ${JSON.stringify(testCase.expect.rangeSelection)}`, () => {
        component.rangeSelection.setValue(testCase.select);

        fixture.detectChanges();

        console.log('-------------');

        expect(component.rangeSelection.value).toEqual(
          testCase.expect.rangeSelection
        );
        expect(component.interval).toEqual(testCase.expect.interval);
      });
    }

    it('should throw an error if the range is out of bounds', fakeAsync(() => {
      expect(() => {
        component.rangeSelection.setValue({ lower: 0, upper: 0 });
        fixture.detectChanges();
        tick();
      }).toThrow(new Error('range out of bounds for chartFeedbackStatistic'));
    }));
  });

  describe('label formatter', () => {
    it('should correctly format a value', () => {
      component.rangeSelection.setValue({ lower: 1, upper: 5 });
      fixture.detectChanges();

      expect(component.getLabelFormatter()(2)).toEqual('08.01.2023');
    });

    it('should correctly format a value when it is the lower bound', () => {
      component.rangeSelection.setValue({ lower: 1, upper: 5 });
      fixture.detectChanges();

      expect(component.getLabelFormatter()(1)).toEqual('01.01.2023');
    });

    it('should return null if the value is undefined or null', () => {
      component.rangeSelection.setValue({ lower: 1, upper: 5 });
      fixture.detectChanges();

      expect(component.getLabelFormatter()(null)).toEqual(null);
      expect(component.getLabelFormatter()(undefined)).toEqual(null);
    });
  });
});
