/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackStatisticBarChartComponent } from './feedback-statistic-bar-chart.component';
import { TranslateService } from '@ngx-translate/core';
import { DataFakerUtility } from '../utilities/data-faker.utility';
import { SimpleChange } from '@angular/core';
import { ChartsModule } from '../charts.module';

describe('FeedbackStatisticComponent', () => {
  let component: FeedbackStatisticBarChartComponent;
  let fixture: ComponentFixture<FeedbackStatisticBarChartComponent>;
  let mockTranslateService: Partial<TranslateService>;

  beforeEach(async () => {
    mockTranslateService = {
      instant(key: string | string[]): any {
        return key;
      },
    };

    await TestBed.configureTestingModule({
      declarations: [FeedbackStatisticBarChartComponent],
      imports: [ChartsModule.forRoot()],
      providers: [
        {
          provide: TranslateService,
          useValue: mockTranslateService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update the config on changes', () => {
    const start = new Date('2023-01-01T00:00:00.000Z');
    const end = new Date('2023-01-05T00:00:00.000Z');
    const duration = { days: 1 };
    const categories = ['Category'];
    const feedbackStatistic = DataFakerUtility.generateFeedbackStatistic(
      start,
      end,
      duration,
      categories
    );
    component.feedbackStatistic = feedbackStatistic;
    component.interval = {
      start,
      end,
    };
    component.ngOnChanges({
      feedbackStatistic: new SimpleChange(null, feedbackStatistic, true),
    });
    expect(component.config).toBeTruthy();
  });
});
