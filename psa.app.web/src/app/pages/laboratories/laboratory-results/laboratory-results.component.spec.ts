/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MockBuilder } from 'ng-mocks';

import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { CurrentUser } from '../../../_services/current-user.service';
import { AppModule } from '../../../app.module';
import { LaboratoryResultsComponent } from './laboratory-results.component';
import { Subject } from 'rxjs';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { By } from '@angular/platform-browser';
import SpyObj = jasmine.SpyObj;
import { AlertService } from '../../../_services/alert.service';

describe('LaboratoryResultsComponent', () => {
  let component: LaboratoryResultsComponent;
  let fixture: ComponentFixture<LaboratoryResultsComponent>;

  let activatedRoute: SpyObj<ActivatedRoute>;
  let activatedRouteParams: Subject<Params>;
  let sampleTrackingService: SpyObj<SampleTrackingService>;
  let router: SpyObj<Router>;
  let user: SpyObj<CurrentUser>;

  beforeEach(async () => {
    // Provider and Services
    activatedRouteParams = new Subject<Params>();
    activatedRoute = jasmine.createSpyObj<ActivatedRoute>([], {
      params: activatedRouteParams.asObservable(),
    });
    sampleTrackingService = jasmine.createSpyObj<SampleTrackingService>([
      'getAllLabResultsForUser',
    ]);
    router = jasmine.createSpyObj<Router>(['navigate']);
    user = jasmine.createSpyObj<CurrentUser>(['isProband', 'hasRole'], {
      username: 'Testproband',
    });
    user.isProband.and.returnValue(true);
    user.hasRole.and.returnValue(false);

    // Build Base Module
    await MockBuilder(LaboratoryResultsComponent, AppModule)
      .mock(ActivatedRoute, activatedRoute)
      .mock(SampleTrackingService, sampleTrackingService)
      .mock(Router, router)
      .mock(CurrentUser, user);
  });

  it('should show the lab result table', fakeAsync(() => {
    // Arrange
    sampleTrackingService.getAllLabResultsForUser.and.resolveTo([
      createLabResult(),
    ]);
    createComponent();

    // Act
    activatedRouteParams.next({ user_id: 'Testuser' });
    tick();
    fixture.detectChanges();

    // Assert
    expect(
      sampleTrackingService.getAllLabResultsForUser
    ).toHaveBeenCalledOnceWith('Testuser');
    expect(component.labResultsList).toEqual([createLabResult()]);
    expect(
      fixture.debugElement.query(By.css('[unit-lab-result-table]'))
    ).not.toBeNull();
  }));

  it('should show empty results message', fakeAsync(() => {
    // Arrange
    sampleTrackingService.getAllLabResultsForUser.and.resolveTo([]);
    createComponent();

    // Act
    activatedRouteParams.next({});
    tick();
    fixture.detectChanges();

    // Assert
    expect(
      sampleTrackingService.getAllLabResultsForUser
    ).toHaveBeenCalledOnceWith('Testproband');
    expect(component.labResultsList).toEqual([]);
    expect(
      fixture.debugElement.query(By.css('[unit-empty-results-message]'))
    ).not.toBeNull();
  }));

  it('should show an alert on errors', fakeAsync(() => {
    // Arrange
    sampleTrackingService.getAllLabResultsForUser.and.rejectWith('some error');
    createComponent();
    const alertService = TestBed.inject(AlertService);

    // Act
    activatedRouteParams.next({});
    tick();
    fixture.detectChanges();

    // Assert
    expect(
      sampleTrackingService.getAllLabResultsForUser
    ).toHaveBeenCalledOnceWith('Testproband');
    expect(alertService.errorObject).toHaveBeenCalledTimes(1);
    expect(component.labResultsList).toEqual([]);
    expect(
      fixture.debugElement.query(By.css('[unit-empty-results-message]'))
    ).not.toBeNull();
  }));

  function createComponent(): void {
    // Create component
    fixture = TestBed.createComponent(LaboratoryResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges();
  }

  function createLabResult(): LabResult {
    return {
      id: '1234',
      user_id: 'Testuser',
      order_id: 1,
      dummy_sample_id: 'id',
      performing_doctor: 'doctor',
      date_of_sampling: '2016-02-14',
      remark: 'remark',
      status: 'status',
      study_status: 'status',
      new_samples_sent: true,
    };
  }
});
