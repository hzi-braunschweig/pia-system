/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { StudiesComponent } from './studies.component';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  convertToParamMap,
  ParamMap,
} from '@angular/router';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyPaginatorModule as MatPaginatorModule } from '@angular/material/legacy-paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { createStudy } from '../../../psa.app.core/models/instance.helper.spec';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { NEVER, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SpecificHttpError } from '../../../psa.app.core/models/specificHttpError';
import { StudyChangeService } from '../study-change.service';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import createSpyObj = jasmine.createSpyObj;
import { CurrentUser } from '../../../_services/current-user.service';
import { By } from '@angular/platform-browser';

describe('StudiesComponent', () => {
  let fixture: ComponentFixture<StudiesComponent>;
  let component: StudiesComponent;
  let queryParamMapGetter: Spy<() => ParamMap>;
  let userService: SpyObj<UserService>;
  let authService: SpyObj<AuthService>;
  let snapshot: SpyObj<ActivatedRouteSnapshot>;
  let matDialog: SpyObj<MatDialog>;
  let user: SpyObj<CurrentUser>;
  let studyChangeService: SpyObj<StudyChangeService>;

  let afterClosedSubject: Subject<
    string | (HttpErrorResponse & SpecificHttpError)
  >;

  beforeEach(async () => {
    // Provider and Services
    snapshot = createSpyObj<ActivatedRouteSnapshot>(
      'ActivatedRouteSnapshot',
      undefined,
      ['queryParamMap']
    );
    queryParamMapGetter = Object.getOwnPropertyDescriptor(
      snapshot,
      'queryParamMap'
    ).get as Spy;
    authService = createSpyObj<AuthService>('AuthService', [
      'getPendingDeletion',
      'deletePendingStudyChange',
    ]);
    userService = createSpyObj<UserService>('UserService', ['getStudies']);
    userService.getStudies.and.resolveTo([
      createStudy({ name: 'Teststudy1' }),
      createStudy({
        name: 'Teststudy2',
        pendingStudyChange: { id: 1, requested_for: 'TestForscher' },
      }),
    ]);
    afterClosedSubject = new Subject();
    matDialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    matDialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<unknown>);
    user = createSpyObj<CurrentUser>('CurrentUser', ['hasRole'], {
      username: 'TestForscher',
    });
    user.hasRole.and.returnValue(true);
    studyChangeService = createSpyObj<StudyChangeService>(
      'StudyChangeService',
      [
        'reviewPendingStudyChange',
        'changeStudyAsSysAdmin',
        'requestStudyChange',
      ]
    );
    studyChangeService.reviewPendingStudyChange.and.returnValue(NEVER);
    studyChangeService.changeStudyAsSysAdmin.and.returnValue(NEVER);
    studyChangeService.requestStudyChange.and.returnValue(NEVER);

    // Build Base Module
    await MockBuilder(StudiesComponent, AppModule)
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .mock(MatDialog, matDialog)
      .mock(ActivatedRoute, { snapshot })
      .mock(AuthService, authService)
      .mock(UserService, userService)
      .mock(CurrentUser, user)
      .mock(StudyChangeService, studyChangeService);
  });

  describe('init without params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));
      createComponent();
      tick();
      fixture.detectChanges();
    }));

    it('should should open create study dialog', () => {
      // Arrange
      const createStudyButton = fixture.debugElement.query(
        By.css('[data-unit="create-study-button"]')
      );

      // Act
      createStudyButton.nativeElement.click();

      // Assert
      expect(studyChangeService.changeStudyAsSysAdmin).toHaveBeenCalled();
    });
  });

  describe('init with pending deletion params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(
        convertToParamMap({
          pendingDeletionId: '1',
          type: 'study',
        })
      );
      authService.getPendingDeletion.and.resolveTo({
        id: 1,
        type: 'study',
        for_id: 'Teststudy2',
        requested_for: 'PM-Me',
        requested_by: 'PM-Partner',
      });
      createComponent();
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
    });
  });

  describe('init with pending change params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(
        convertToParamMap({
          pendingStudyChangeId: '1',
        })
      );
      createComponent();
    }));

    it('should show dialog to review study changes', fakeAsync(() => {
      tick();
      expect(component).toBeDefined();
      expect(studyChangeService.reviewPendingStudyChange).toHaveBeenCalled();
    }));
  });

  function createComponent(): void {
    // Create component
    fixture = TestBed.createComponent(StudiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }
});
