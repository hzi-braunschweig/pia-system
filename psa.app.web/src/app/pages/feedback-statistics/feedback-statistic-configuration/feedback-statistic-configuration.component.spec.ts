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
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of, Subject, throwError } from 'rxjs';
import { LoadingSpinnerComponent } from '../../../features/loading-spinner/loading-spinner.component';
import { FeedbackStatisticMetaDataComponent } from '../feedback-statistic-meta-data/feedback-statistic-meta-data.component';
import { FeedbackStatisticsService } from '../feedback-statistics.service';
import { RelativeFrequencyTimeSeriesConfigurationComponent } from '../relative-frequency-time-series-configuration/relative-frequency-time-series-configuration.component';

import { FeedbackStatisticConfigurationComponent } from './feedback-statistic-configuration.component';
import { FeedbackStatisticConfigurationDto } from './feedback-statistic-configuration.model';
import SpyObj = jasmine.SpyObj;

class MockConfigurationComponent {
  public readonly form = new FormGroup({
    title: new FormControl('test', [Validators.required]),
    type: new FormControl('relative_frequency_time_series'),
    study: new FormControl('Teststudy'),
  });

  public setConfiguration(configuration: unknown): void {
    this.form.patchValue(configuration);
  }

  public getConfiguration(): unknown {
    return this.form.value;
  }
}

describe('FeedbackStatisticConfigurationComponent', () => {
  let component: FeedbackStatisticConfigurationComponent;
  let fixture: ComponentFixture<FeedbackStatisticConfigurationComponent>;

  let activatedRoute;
  let feedbackStatisticsService: SpyObj<FeedbackStatisticsService>;
  let router: SpyObj<Router>;
  let matDialog: SpyObj<MatDialog>;
  let matSnackBar: SpyObj<MatSnackBar>;
  let translateService: SpyObj<TranslateService>;
  let dialogAfterClosed = new Subject<boolean>();

  beforeEach(async () => {
    activatedRoute = { snapshot: { params: { studyName: 'Teststudy' } } };

    feedbackStatisticsService = jasmine.createSpyObj(
      'FeedbackStatisticsService',
      [
        'getFeedbackStatisticConfiguration',
        'putFeedbackStatisticConfiguration',
        'postFeedbackStatisticConfiguration',
      ]
    );
    feedbackStatisticsService.getFeedbackStatisticConfiguration.and.returnValue(
      of({ title: 'new-test' } as unknown as FeedbackStatisticConfigurationDto)
    );
    feedbackStatisticsService.putFeedbackStatisticConfiguration.and.returnValue(
      of({} as FeedbackStatisticConfigurationDto)
    );
    feedbackStatisticsService.postFeedbackStatisticConfiguration.and.returnValue(
      of({} as FeedbackStatisticConfigurationDto)
    );

    router = jasmine.createSpyObj('Router', ['navigate']);

    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    matDialog.open.and.returnValue({
      afterClosed: () => dialogAfterClosed.asObservable(),
    } as MatDialogRef<unknown>);

    matSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    translateService = jasmine.createSpyObj('MatSnackBar', ['instant']);
    translateService.instant.and.returnValue('errorText');
  });

  describe('edit mode', () => {
    beforeEach(async () => {
      activatedRoute.snapshot.params = {
        configurationId: 1234,
        studyName: 'Teststudy',
      };
      await createComponent();
      component.ngAfterViewInit();
    });

    it('should fetch and set an existing configuration', fakeAsync(() => {
      tick();
      expect(
        feedbackStatisticsService.getFeedbackStatisticConfiguration
      ).toHaveBeenCalledWith(1234, 'Teststudy');

      tick();

      expect(component.metaDataConfigurationComponent.form.value).toEqual({
        title: 'new-test',
        type: 'relative_frequency_time_series',
        study: 'Teststudy',
      });
    }));

    describe('submit()', () => {
      beforeEach(() => {
        component.specificConfigurationComponent =
          new MockConfigurationComponent() as unknown as RelativeFrequencyTimeSeriesConfigurationComponent;
      });

      it('should update an existing configuration', fakeAsync(() => {
        component.submit();

        expect(
          feedbackStatisticsService.putFeedbackStatisticConfiguration
        ).toHaveBeenCalledWith({
          id: 1234,
          title: 'test',
          type: 'relative_frequency_time_series',
          study: 'Teststudy',
        } as FeedbackStatisticConfigurationDto);
      }));

      it('should navigate back after update and dialog close', fakeAsync(async () => {
        component.submit();

        tick();
        dialogAfterClosed.next(true);
        tick();
        expect(router.navigate).toHaveBeenCalledWith([
          'feedback-statistics',
          'study',
          'Teststudy',
        ]);
      }));

      it('should not update if the form is invalid', () => {
        component.metaDataConfigurationComponent.form.controls.title.setValue(
          null
        );

        component.submit();

        expect(
          feedbackStatisticsService.putFeedbackStatisticConfiguration
        ).not.toHaveBeenCalled();
        expect(
          component.metaDataConfigurationComponent.form.touched
        ).toBeTrue();
      });

      it('should show a notification if the update does not work', fakeAsync(() => {
        feedbackStatisticsService.putFeedbackStatisticConfiguration.and.returnValue(
          throwError(() => 'error')
        );

        component.submit();
        tick();

        expect(matSnackBar.open).toHaveBeenCalledOnceWith('errorText', 'X', {
          panelClass: ['error'],
          duration: 4000,
        });
      }));
    });
  });

  describe('non edit mode', () => {
    beforeEach(async () => {
      await createComponent();
    });

    it('should set given study name', fakeAsync(() => {
      tick();
      expect(
        component.metaDataConfigurationComponent.form.controls.study.value
      ).toEqual('Teststudy');

      expect(
        feedbackStatisticsService.getFeedbackStatisticConfiguration
      ).not.toHaveBeenCalled();
    }));

    describe('submit()', () => {
      beforeEach(() => {
        component.specificConfigurationComponent =
          new MockConfigurationComponent() as unknown as RelativeFrequencyTimeSeriesConfigurationComponent;
      });

      it('should create a new configuration', fakeAsync(() => {
        component.submit();

        expect(
          feedbackStatisticsService.postFeedbackStatisticConfiguration
        ).toHaveBeenCalledWith({
          title: 'test',
          type: 'relative_frequency_time_series',
          study: 'Teststudy',
        } as FeedbackStatisticConfigurationDto);
      }));

      it('should navigate back after update and dialog close', fakeAsync(async () => {
        component.submit();

        tick();
        dialogAfterClosed.next(true);
        tick();
        expect(router.navigate).toHaveBeenCalledWith([
          'feedback-statistics',
          'study',
          'Teststudy',
        ]);
      }));

      it('should not update if the form is invalid', () => {
        component.metaDataConfigurationComponent.form.controls.title.setValue(
          null
        );

        component.submit();

        expect(
          feedbackStatisticsService.postFeedbackStatisticConfiguration
        ).not.toHaveBeenCalled();
        expect(
          component.metaDataConfigurationComponent.form.touched
        ).toBeTrue();
      });

      it('should show a notification if saving does not work', fakeAsync(() => {
        feedbackStatisticsService.postFeedbackStatisticConfiguration.and.returnValue(
          throwError(() => 'error')
        );

        component.submit();
        tick();

        expect(matSnackBar.open).toHaveBeenCalledOnceWith('errorText', 'X', {
          panelClass: ['error'],
          duration: 4000,
        });
      }));
    });
  });

  async function createComponent(): Promise<void> {
    await TestBed.configureTestingModule({
      declarations: [
        FeedbackStatisticConfigurationComponent,
        MockComponent(LoadingSpinnerComponent),
        MockComponent(FeedbackStatisticMetaDataComponent),
        MockComponent(RelativeFrequencyTimeSeriesConfigurationComponent),
        MockPipe(TranslatePipe),
      ],
      providers: [
        MockProvider(ActivatedRoute, activatedRoute),
        MockProvider(FeedbackStatisticsService, feedbackStatisticsService),
        MockProvider(Router, router),
        MockProvider(MatDialog, matDialog),
        MockProvider(MatSnackBar, matSnackBar),
        MockProvider(TranslateService, translateService),
      ],
      imports: [MatButtonModule, MatIconModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedbackStatisticConfigurationComponent);
    component = fixture.componentInstance;
    component.metaDataConfigurationComponent =
      new MockConfigurationComponent() as unknown as FeedbackStatisticMetaDataComponent;
    component.specificConfigurationComponent =
      new MockConfigurationComponent() as unknown as RelativeFrequencyTimeSeriesConfigurationComponent;
    fixture.detectChanges();
  }
});
