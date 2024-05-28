/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, RangeCustomEvent } from '@ionic/angular';

import {
  FeedbackStatisticComponent,
  RangeValueObject,
} from './feedback-statistic.component';
import { MarkdownModule } from 'ngx-markdown';
import {
  ChartsModule,
  ColorPaletteUtility,
  DataFakerUtility,
  FeedbackStatisticDto,
  FeedbackStatisticStatus,
  RelativeFrequencyTimeSeriesDataDto,
} from '@pia-system/charts';
import { TranslateModule } from '@ngx-translate/core';
import { add } from 'date-fns';
import { Component, ViewChild } from '@angular/core';
import { RangeValue } from '@ionic/core/dist/types/components/range/range-interface';

@Component({
  selector: 'app-mock',
  template:
    '<app-feedback-statistic [feedbackStatisticDto]="feedbackStatisticDto"></app-feedback-statistic>',
})
class MockComponent {
  @ViewChild(FeedbackStatisticComponent)
  public childComponent: FeedbackStatisticComponent;
  public feedbackStatisticDto: FeedbackStatisticDto = createFakeResponse(
    {
      title: 'Title',
      description: 'Description',
    },
    { weeks: 10 },
    { weeks: 1 }
  );
}

const startDate = new Date('2023-01-01T00:00:00.000Z');

describe('FeedbackStatisticComponent', () => {
  let component: MockComponent;
  let fixture: ComponentFixture<MockComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [MockComponent, FeedbackStatisticComponent],
        imports: [
          IonicModule.forRoot(),
          MarkdownModule.forRoot(),
          TranslateModule.forRoot(),
          ChartsModule.forRoot(),
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(MockComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component.childComponent).toBeTruthy();
  });

  it('should display the title and description', () => {
    // checking for fixture.detectChanges is important here because the used markdown pipe returns a promise
    // the first change detection cycle only inits the component and does not detect the promise
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('[data-unit="title"]');
    expect(title.textContent).toBe('Title');

    const description = fixture.nativeElement.querySelector(
      '[data-unit="description"]'
    );
    expect(description.textContent).toContain('Description');
  });

  describe('when statistic has no data', () => {
    for (const status of [
      'pending',
      'error',
      'insufficient_data',
    ] as FeedbackStatisticStatus[]) {
      it(`should display a message on status "${status}"`, () => {
        component.feedbackStatisticDto = {
          ...component.feedbackStatisticDto,
          status: 'insufficient_data',
        };
        fixture.detectChanges();

        const title = fixture.nativeElement.querySelector(
          '[data-unit="message-no-data"]'
        );
        expect(title.textContent).toBe('FEEDBACK_STATISTICS.NO_DATA');
      });
    }
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
          lower: 11,
          upper: 11,
        },
        expect: {
          rangeSelection: {
            lower: 10,
            upper: 11,
          },
          interval: {
            start: add(startDate, { weeks: 9 }),
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
            upper: 2,
          },
          interval: {
            start: add(startDate, { weeks: 0 }),
            end: add(startDate, { weeks: 1 }),
          },
        },
      },
    ];

    for (const testCase of testCases) {
      it(`should select the range ${JSON.stringify(
        testCase.select
      )} => ${JSON.stringify(testCase.expect.rangeSelection)}`, () => {
        const event: Partial<RangeCustomEvent> = {
          detail: {
            value: testCase.select,
          },
        };
        component.childComponent.rangeSelection =
          testCase.expect.rangeSelection;
        component.childComponent.selectChartInterval(event as Event);
        fixture.detectChanges();

        expect(component.childComponent.rangeSelection as RangeValue).toEqual(
          testCase.expect.rangeSelection
        );
        expect(component.childComponent.interval).toEqual(
          testCase.expect.interval
        );
      });
    }
  });
});

function createFakeResponse(
  overwrite: Partial<FeedbackStatisticDto> = {},
  duration: Duration = { weeks: 10 },
  cycle: Duration = { weeks: 1 },
  categories: string[] = [
    'Sneeze',
    'Headache',
    'Running nose',
    'Walking nose',
    'Climbing nose',
    'Sleeping nose',
  ]
): FeedbackStatisticDto {
  const fakeData = DataFakerUtility.generateFeedbackStatistic(
    startDate,
    add(startDate, duration),
    cycle,
    categories
  );

  const data: RelativeFrequencyTimeSeriesDataDto[] = fakeData.series.map(
    (series, i) => ({
      color: ColorPaletteUtility.getColorForIterator(i),
      label: series.label,
      intervals: fakeData.intervals.map((interval, i) => ({
        value: series.data[i],
        timeRange: {
          startDate: interval[0].toISOString(),
          endDate: interval[1].toISOString(),
        },
      })),
    })
  );

  return {
    type: 'relative_frequency_time_series',
    configurationId: 1,
    status: 'has_data',
    title: 'title',
    description: 'description',
    updatedAt: '2021-01-01T00:00:00.000Z',
    data,
    ...overwrite,
  };
}
