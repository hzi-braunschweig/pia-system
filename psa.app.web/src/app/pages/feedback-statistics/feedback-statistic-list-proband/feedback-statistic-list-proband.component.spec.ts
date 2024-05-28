/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackStatisticListProbandComponent } from './feedback-statistic-list-proband.component';
import { FeedbackStatisticsService } from '../feedback-statistics.service';
import { delay, EMPTY, of } from 'rxjs';
import { createFakeFeedbackStatisticDto } from '../create-fake-feedback-statistic-dto.spec';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { LoadingSpinnerComponent } from '../../../features/loading-spinner/loading-spinner.component';
import { FeedbackStatisticComponent } from '../feedback-statistic/feedback-statistic.component';
import { TranslatePipe } from '@ngx-translate/core';
import { MatCardModule } from '@angular/material/card';
import SpyObj = jasmine.SpyObj;

describe('FeedbackStatisticListProbandComponent', () => {
  let component: FeedbackStatisticListProbandComponent;
  let fixture: ComponentFixture<FeedbackStatisticListProbandComponent>;

  let feedbackStatisticsService: SpyObj<FeedbackStatisticsService>;

  beforeEach(async () => {
    feedbackStatisticsService = jasmine.createSpyObj(
      'FeedbackStatisticsService',
      [
        'deleteFeedbackStatisticConfiguration',
        'getFeedbackStatisticsForProband',
      ]
    );
    feedbackStatisticsService.deleteFeedbackStatisticConfiguration.and.returnValue(
      EMPTY
    );
    feedbackStatisticsService.getFeedbackStatisticsForProband.and.returnValue(
      of([createFakeFeedbackStatisticDto()]).pipe(delay(30))
    );

    await TestBed.configureTestingModule({
      declarations: [
        FeedbackStatisticListProbandComponent,
        MockComponent(LoadingSpinnerComponent),
        MockComponent(FeedbackStatisticComponent),
        MockPipe(TranslatePipe),
      ],
      providers: [
        MockProvider(FeedbackStatisticsService, feedbackStatisticsService),
      ],
      imports: [MatCardModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticListProbandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
