/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { MatLegacyDialog as MatDialog } from '@angular/material/legacy-dialog';
import { fakeAsync, tick } from '@angular/core/testing';
import { SampleManagementComponent } from './sample-management.component';
import { CurrentUser } from '../../../_services/current-user.service';
import { ProbandService } from '../../../psa.app.core/providers/proband-service/proband.service';
import { Router } from '@angular/router';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { DataService } from '../../../_services/data.service';
import { PersonalDataService } from '../../../psa.app.core/providers/personaldata-service/personaldata-service';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { MediaChange, MediaObserver } from '@angular/flex-layout';
import { firstValueFrom, from, NEVER, toArray } from 'rxjs';
import {
  createPersonalData,
  createProband,
} from '../../../psa.app.core/models/instance.helper.spec';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatSortModule } from '@angular/material/sort';
import { FormControl } from '@angular/forms';
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
    mediaObserver = jasmine.createSpyObj<MediaObserver>('MediaObserver', [
      'isActive',
      'asObservable',
    ]);
    mediaObserver.asObservable.and.returnValues(NEVER);

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

  it('should initialize the table when study is selected', fakeAsync(() => {
    expect(personalDataService.getPersonalDataAll).toHaveBeenCalledTimes(1);
    component.studyName.setValue('Teststudy1');
    tick();
    expect(probandService.getProbands).toHaveBeenCalledOnceWith('Teststudy1');
    expect(component.dataSource.data.length).toEqual(3);
  }));

  describe('validateSampleID', () => {
    const invalid = { sampleWrongFormat: true };
    const fixture = [
      ['ZIFCO-1234567890', null],
      ['ZIFCO-3333333333', null],
      ['ZIFCO-123456789', invalid],
      ['ZIFCO-ABCDEFGAJK', invalid],
      ['ZIFC0-12345678910', invalid],
      ['zifco-12345678910', invalid],
      ['ABCDE-12345678910', invalid],
    ];

    for (const test of fixture) {
      const [id, expectation] = test;
      it(`should ${expectation === null ? 'allow' : 'disallow'} ${id}`, () => {
        expect(component.validateSampleID(new FormControl(id))).toEqual(
          expectation
        );
      });
    }
  });

  it('should adjust header columns according to screen size', async () => {
    const changes = from(
      Array.from(component.mediaColumnMap.keys()).map((mqAlias) => [
        new MediaChange(null, null, mqAlias),
      ])
    );
    mediaObserver.asObservable.and.returnValue(changes);
    mediaObserver.isActive.and.returnValue(true);

    component.initializeCols();

    const cols = await firstValueFrom(component.cols.pipe(toArray()));
    expect(cols).toEqual([5, ...Array.from(component.mediaColumnMap.values())]);
  });
});
