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
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { createStudy } from '../../../psa.app.core/models/instance.helper.spec';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import createSpyObj = jasmine.createSpyObj;

describe('StudiesComponent', () => {
  let fixture: ComponentFixture<StudiesComponent>;
  let component: StudiesComponent;
  let queryParamMapGetter: Spy<() => ParamMap>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let authService: SpyObj<AuthService>;
  let snapshot: SpyObj<ActivatedRouteSnapshot>;
  let matDialog: SpyObj<MatDialog>;
  let afterClosedSubject: Subject<string>;

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
    afterClosedSubject = new Subject();
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    matDialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<unknown>);

    // Build Base Module
    await MockBuilder(StudiesComponent, AppModule)
      .provide({
        provide: ActivatedRoute,
        useValue: { snapshot },
      })
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .mock(MatDialog, matDialog)
      .mock(AuthService, authService);
  });

  describe('init without params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));
      questionnaireService = TestBed.inject(
        QuestionnaireService
      ) as SpyObj<QuestionnaireService>;
      questionnaireService.getStudies.and.resolveTo({
        studies: [
          createStudy({ name: 'Teststudy1' }),
          createStudy({ name: 'Teststudy2' }),
        ],
      });

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
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

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
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

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
    });
  });

  describe('cancelPendingStudyChange()', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(convertToParamMap({}));

      // Create component
      fixture = TestBed.createComponent(StudiesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
    }));

    it('should cancel a pending compliance change after successful confirmation', fakeAsync(() => {
      component.cancelPendingStudyChange(1);
      afterClosedSubject.next('yes');
      tick();
      expect(authService.deletePendingStudyChange).toHaveBeenCalledOnceWith(1);
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.CHANGE_COMPLIANCES_REJECTED',
          isSuccess: true,
        },
      });
    }));

    it('should show an error if cancellation fails', fakeAsync(() => {
      authService.deletePendingStudyChange.and.rejectWith(
        'some error occurred'
      );
      component.cancelPendingStudyChange(1);
      afterClosedSubject.next('yes');
      tick();
      expect(authService.deletePendingStudyChange).toHaveBeenCalledOnceWith(1);
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'ERROR.ERROR_UNKNOWN',
          isSuccess: false,
        },
      });
    }));
  });
});
