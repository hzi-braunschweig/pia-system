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
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';
import { MockBuilder } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { LaboratoryResultDetailsComponent } from './laboratory-result-details.component';
import { CurrentUser } from '../../../_services/current-user.service';
import { AppModule } from '../../../app.module';

describe('LaboratoryResultDetailsComponent', () => {
  let component: LaboratoryResultDetailsComponent;
  let fixture: ComponentFixture<LaboratoryResultDetailsComponent>;

  let activatedRoute: SpyObj<ActivatedRoute>;
  let activatedRouteSnapshot: ActivatedRouteSnapshot;
  let sampleTrackingService: SpyObj<SampleTrackingService>;
  let router: SpyObj<Router>;
  let user: SpyObj<CurrentUser>;

  const labResultHtml: string = 'this is a <b>lab result</b>';

  beforeEach(async () => {
    // Provider and Services
    activatedRouteSnapshot = new ActivatedRouteSnapshot();
    activatedRoute = jasmine.createSpyObj<ActivatedRoute>([], {
      snapshot: activatedRouteSnapshot,
    });
    sampleTrackingService = jasmine.createSpyObj<SampleTrackingService>([
      'getLabResultObservationForUser',
    ]);
    sampleTrackingService.getLabResultObservationForUser.and.resolveTo(
      labResultHtml
    );
    router = jasmine.createSpyObj<Router>(['navigate']);
    user = jasmine.createSpyObj<CurrentUser>([], {
      study: 'Teststudy',
      username: 'Testproband',
    });

    // Build Base Module
    await MockBuilder(LaboratoryResultDetailsComponent, AppModule)
      .mock(ActivatedRoute, activatedRoute)
      .mock(SampleTrackingService, sampleTrackingService)
      .mock(Router, router)
      .mock(CurrentUser, user);
  });

  describe('ngOnInit()', () => {
    it('should initialize the component', fakeAsync(() => {
      activatedRouteSnapshot.queryParams = { user_id: 'Testuser' };
      activatedRouteSnapshot.params = { id: '1234' };
      createComponent();
      expect(
        sampleTrackingService.getLabResultObservationForUser
      ).toHaveBeenCalledOnceWith('Testuser', '1234');
      expect(component.labResultHtml).toEqual(labResultHtml);
    }));

    it('should initialize without user_id param', fakeAsync(() => {
      activatedRouteSnapshot.params = { id: '4321' };
      createComponent();
      expect(
        sampleTrackingService.getLabResultObservationForUser
      ).toHaveBeenCalledOnceWith('Testproband', '4321');
      expect(component.labResultHtml).toEqual(labResultHtml);
    }));
  });

  describe('onBackButtonClicked()', () => {
    it('should navigate to specific result if id is given', fakeAsync(() => {
      activatedRouteSnapshot.queryParams = { user_id: 'Testuser' };
      activatedRouteSnapshot.params = { id: '1234' };
      createComponent();
      component.onBackButtonClicked();
      expect(router.navigate).toHaveBeenCalledOnceWith([
        '/laboratory-results/',
        { user_id: 'Testuser' },
      ]);
    }));

    it('should navigate to lab result overview', fakeAsync(() => {
      createComponent();
      component.onBackButtonClicked();
      expect(router.navigate).toHaveBeenCalledOnceWith(['/laboratory-results']);
    }));
  });

  function createComponent(): void {
    // Create component
    fixture = TestBed.createComponent(LaboratoryResultDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges();
  }
});
