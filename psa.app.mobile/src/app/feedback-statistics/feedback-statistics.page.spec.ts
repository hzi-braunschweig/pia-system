/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FeedbackStatisticsPage } from './feedback-statistics.page';
import { TranslateModule } from '@ngx-translate/core';
import { FeedbackStatisticClientService } from './services/feedback-statistic-client.service';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BehaviorSubject, defer } from 'rxjs';
import { FeedbackStatisticDto } from '@pia-system/charts';
import createFakeFeedbackStatisticDto from './utilities/create-fake-feedback-statistic-dto.spec';

describe('FeedbackStatisticsPage', () => {
  const serviceFeedbackStatistics = new BehaviorSubject<FeedbackStatisticDto[]>(
    []
  );
  let component: FeedbackStatisticsPage;
  let fixture: ComponentFixture<FeedbackStatisticsPage>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [FeedbackStatisticsPage],
        imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
        providers: [
          {
            provide: FeedbackStatisticClientService,
            useValue: {
              getFeedbackStatistics: () =>
                defer(() => serviceFeedbackStatistics),
            },
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      fixture = TestBed.createComponent(FeedbackStatisticsPage);
      component = fixture.componentInstance;
      fixture.detectChanges();
    })
  );

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show message if no feedback statistics are available', () => {
    serviceFeedbackStatistics.next([]);
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector(
      '[data-unit="message-no-charts"]'
    );
    const feedbackStatistics = fixture.nativeElement.querySelectorAll(
      '[data-unit="feedback-statistic"]'
    );
    expect(feedbackStatistics.length).toEqual(0);
    expect(message?.textContent).toEqual('FEEDBACK_STATISTICS.NO_CHARTS');
  });

  it('should show charts when feedback statistics are available', () => {
    const feedbackStatistic = createFakeFeedbackStatisticDto(
      {
        title: 'Title',
        description: 'Description',
        status: 'has_data',
      },
      { days: 1 },
      { days: 1 }
    );
    serviceFeedbackStatistics.next([
      feedbackStatistic,
      feedbackStatistic,
      feedbackStatistic,
    ]);
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector(
      '[data-unit="message-no-charts"]'
    );
    const feedbackStatistics = fixture.nativeElement.querySelectorAll(
      '[data-unit="feedback-statistic"]'
    );
    expect(message).toEqual(null);
    expect(feedbackStatistics.length).toEqual(3);
  });
});
