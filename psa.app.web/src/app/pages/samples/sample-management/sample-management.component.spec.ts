/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { MatDialog } from '@angular/material/dialog';
import { fakeAsync, tick } from '@angular/core/testing';
import { SampleManagementComponent } from './sample-management.component';
import { CurrentUser } from '../../../_services/current-user.service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { Router } from '@angular/router';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { DataService } from '../../../_services/data.service';
import { PersonalDataService } from '../../../psa.app.core/providers/personaldata-service/personaldata-service';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { MediaObserver } from '@angular/flex-layout';
import { NEVER } from 'rxjs';
import {
  createPersonalData,
  createProband,
} from '../../../psa.app.core/models/instance.helper.spec';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import SpyObj = jasmine.SpyObj;

describe('SampleManagementComponent', () => {
  let fixture: MockedComponentFixture;
  let component: SampleManagementComponent;

  let currentUser: SpyObj<CurrentUser>;
  let probandService: SpyObj<ProbandService>;
  let router: SpyObj<Router>;
  let sampleTrackingService: SpyObj<SampleTrackingService>;
  let mediaObserver: SpyObj<MediaObserver>;
  let dataService: SpyObj<DataService>;
  let personalDataService: SpyObj<PersonalDataService>;

  beforeEach(async () => {
    currentUser = jasmine.createSpyObj<CurrentUser>('CurrentUser', [], {
      studies: [],
    });
    probandService = jasmine.createSpyObj<ProbandService>('ProbandService', [
      'getProbands',
    ]);
    probandService.getProbands.and.resolveTo([
      createProband({ pseudonym: 'test-1', study: 'Teststudy1' }),
      createProband({ pseudonym: 'test-2', study: 'Teststudy1' }),
      createProband({
        pseudonym: 'test-3',
        ids: 'TEST-3',
        study: 'Teststudy1',
      }),
    ]);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    sampleTrackingService = jasmine.createSpyObj<SampleTrackingService>(
      'SampleTrackingService',
      ['getLabResultsForSampleID', 'getBloodSamplesForBloodSampleID']
    );
    mediaObserver = jasmine.createSpyObj<MediaObserver>(
      'MediaObserver',
      ['isActive'],
      {
        media$: NEVER,
      }
    );
    dataService = jasmine.createSpyObj<DataService>('DataService', [
      'setProbandsForCreateLetters',
    ]);
    personalDataService = jasmine.createSpyObj<PersonalDataService>(
      'PersonalDataService',
      ['getPersonalDataAll']
    );
    personalDataService.getPersonalDataAll.and.resolveTo([
      createPersonalData({ pseudonym: 'test-1' }),
      createPersonalData({ pseudonym: 'test-2' }),
      createPersonalData({ pseudonym: 'test-3' }),
    ]);

    // Build Base Module
    await MockBuilder(SampleManagementComponent, AppModule)
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .mock(CurrentUser, currentUser)
      .mock(ProbandService, probandService)
      .mock(Router, router)
      .mock(MatDialog)
      .mock(SampleTrackingService, sampleTrackingService)
      .mock(MediaObserver, mediaObserver)
      .mock(DataService, dataService)
      .mock(PersonalDataService, personalDataService)
      .mock(AccountStatusPipe);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(SampleManagementComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('it should initialize the table when study is selected', fakeAsync(() => {
    expect(personalDataService.getPersonalDataAll).toHaveBeenCalledTimes(1);
    component.studyName.setValue('Teststudy1');
    tick();
    expect(probandService.getProbands).toHaveBeenCalledOnceWith('Teststudy1');
    expect(component.dataSource.data.length).toEqual(3);
  }));
});
