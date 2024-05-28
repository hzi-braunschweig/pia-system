/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import { FeedbackStatisticListResearcherComponent } from './feedback-statistic-list-researcher.component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { FeedbackStatisticsService } from '../feedback-statistics.service';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { EMPTY, of, Subject } from 'rxjs';
import { StudySelectComponent } from '../../../features/study-select/study-select.component';
import { MatButtonModule } from '@angular/material/button';
import { LoadingSpinnerComponent } from '../../../features/loading-spinner/loading-spinner.component';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FeedbackStatisticComponent } from '../feedback-statistic/feedback-statistic.component';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { createFakeFeedbackStatisticDto } from '../create-fake-feedback-statistic-dto.spec';
import { ReactiveFormsModule } from '@angular/forms';
import SpyObj = jasmine.SpyObj;
import { DialogDeleteComponent } from '../../../_helpers/dialog-delete';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';

describe('FeedbackStatisticListComponent', () => {
  let component: FeedbackStatisticListResearcherComponent;
  let fixture: ComponentFixture<FeedbackStatisticListResearcherComponent>;

  let activatedRoute: ActivatedRoute;
  let paramsSubject = new Subject<Params>();
  let feedbackStatisticsService: SpyObj<FeedbackStatisticsService>;
  let router: SpyObj<Router>;
  let dialog: SpyObj<MatDialog>;
  let translate: SpyObj<TranslateService>;

  beforeEach(async () => {
    activatedRoute = new ActivatedRoute();
    activatedRoute.params = paramsSubject;

    feedbackStatisticsService = jasmine.createSpyObj(
      'FeedbackStatisticsService',
      [
        'deleteFeedbackStatisticConfiguration',
        'getFeedbackStatisticsForResearcher',
      ]
    );
    feedbackStatisticsService.deleteFeedbackStatisticConfiguration.and.returnValue(
      EMPTY
    );
    feedbackStatisticsService.getFeedbackStatisticsForResearcher.and.returnValue(
      of([createFakeFeedbackStatisticDto()])
    );

    router = jasmine.createSpyObj('Router', ['navigate']);

    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => of(true),
    } as MatDialogRef<unknown>);

    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    translate.instant.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      declarations: [
        FeedbackStatisticListResearcherComponent,
        MockComponent(LoadingSpinnerComponent),
        MockComponent(FeedbackStatisticComponent),
        MockPipe(TranslatePipe),
      ],
      providers: [
        MockProvider(ActivatedRoute, activatedRoute),
        MockProvider(FeedbackStatisticsService, feedbackStatisticsService),
        MockProvider(Router, router),
        MockProvider(MatDialog, dialog),
        MockProvider(TranslateService, translate),
      ],
      imports: [
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MockComponent(StudySelectComponent),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticListResearcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('study select', () => {
    it('should navigate to selected study', fakeAsync(() => {
      paramsSubject.next({ studyName: 'Teststudy' });
      tick();

      expect(router.navigate).toHaveBeenCalledWith([
        'feedback-statistics',
        'study',
        'Teststudy',
      ]);
    }));

    it('fetch statistics of selected study', fakeAsync(() => {
      paramsSubject.next({ studyName: 'Teststudy' });
      tick();

      expect(
        feedbackStatisticsService.getFeedbackStatisticsForResearcher
      ).toHaveBeenCalledWith('Teststudy');
    }));
  });

  describe('deleteFeedbackStatistic()', () => {
    it('should ask for confirmation', fakeAsync(() => {
      paramsSubject.next({ studyName: 'Teststudy' });
      tick();

      component.deleteFeedbackStatistic(1);

      expect(dialog.open).toHaveBeenCalledWith(DialogDeleteComponent, {
        width: '500px',
        data: {
          data: 'FEEDBACK_STATISTICS.DELETE_CONFIRMATION_TEXT',
        },
      });
    }));

    it('should call the feedbackStatisticsService to delete a configuration', fakeAsync(() => {
      paramsSubject.next({ studyName: 'Teststudy' });
      tick();

      component.deleteFeedbackStatistic(1);
      tick();

      expect(
        feedbackStatisticsService.deleteFeedbackStatisticConfiguration
      ).toHaveBeenCalledWith(1, 'Teststudy');
    }));
  });
});
