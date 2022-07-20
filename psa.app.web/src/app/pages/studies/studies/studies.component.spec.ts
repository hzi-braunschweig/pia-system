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
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { createStudy } from '../../../psa.app.core/models/instance.helper.spec';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;
import createSpyObj = jasmine.createSpyObj;
import { DialogChangeStudyComponent } from '../../../dialogs/dialog-change-study/dialog-change-study.component';
import { HttpErrorResponse } from '@angular/common/http';
import { SpecificHttpError } from '../../../psa.app.core/models/specificHttpError';
import { DialogDeletePartnerData } from '../../../_helpers/dialog-delete-partner';

describe('StudiesComponent', () => {
  let fixture: ComponentFixture<StudiesComponent>;
  let component: StudiesComponent;
  let queryParamMapGetter: Spy<() => ParamMap>;
  let userService: SpyObj<UserService>;
  let authService: SpyObj<AuthService>;
  let snapshot: SpyObj<ActivatedRouteSnapshot>;
  let matDialog: SpyObj<MatDialog>;
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
      createStudy({ name: 'Teststudy2' }),
    ]);
    afterClosedSubject = new Subject();
    matDialog = jasmine.createSpyObj('MatDialog', ['open']);
    matDialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<unknown>);

    // Build Base Module
    await MockBuilder(StudiesComponent, AppModule)
      .keep(MatFormFieldModule)
      .keep(MatInputModule)
      .keep(MatPaginatorModule)
      .keep(MatSortModule)
      .mock(MatDialog, matDialog)
      .mock(ActivatedRoute, { snapshot })
      .mock(AuthService, authService)
      .mock(UserService, userService);
  });

  describe('init without params', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(convertToParamMap(undefined));
      createComponent();
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

    it('should create the component', () => {
      expect(component).toBeDefined();
      fixture.detectChanges();
    });
  });

  describe('openDialogChangeStudy()', () => {
    beforeEach(fakeAsync(() => {
      // Setup mocks before creating component
      queryParamMapGetter.and.returnValue(
        convertToParamMap({
          pendingStudyChangeId: '1',
        })
      );
      createComponent();
    }));

    it('should open the change study dialog', fakeAsync(() => {
      const study = createStudy();
      component.openDialogChangeStudy(study);
      expect(matDialog.open).toHaveBeenCalledWith(DialogChangeStudyComponent, {
        width: '700px',
        height: 'auto',
        data: { study },
      });
    }));

    it('should handle "rejected" result', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next('rejected');
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.CHANGE_COMPLIANCES_REJECTED',
          isSuccess: false,
        },
      });
    }));

    it('should handle "accepted" result', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next('accepted');
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.CHANGE_COMPLIANCES_ACCEPTED',
          isSuccess: true,
        },
      });
    }));

    it('should handle "requested" result', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next('requested');
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.CHANGE_COMPLIANCES_REQUESTED',
          isSuccess: true,
        },
      });
    }));

    it('should handle specific missing permission error', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next(createSpecificError('MISSING_PERMISSION'));
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.MISSING_PERMISSION',
          isSuccess: false,
        },
      });
    }));

    it('should handle specific existing pending change error', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next(
        createSpecificError('4_EYE_OPPOSITION.PENDING_CHANGE_ALREADY_EXISTS')
      );
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.PENDING_CHANGE_ALREADY_EXISTS',
          isSuccess: false,
        },
      });
    }));

    it('should handle specific requested for not reached error', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next(
        createSpecificError('4_EYE_OPPOSITION.REQUESTED_FOR_NOT_REACHED')
      );
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.REQUESTED_FOR_NOT_REACHED',
          isSuccess: false,
        },
      });
    }));

    it('should handle specific invalid pseudonym prefix error', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next(
        createSpecificError('STUDY.INVALID_PSEUDONYM_PREFIX')
      );
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.INVALID_PSEUDONYM_PREFIX',
          isSuccess: false,
        },
      });
    }));

    it('should handle unknown error', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      component.openDialogChangeStudy(study);
      afterClosedSubject.next('some unknown error');
      tick();

      // Assert
      expect(matDialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'ERROR.ERROR_UNKNOWN',
          isSuccess: false,
        },
      });
    }));
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

  function createComponent(): void {
    // Create component
    fixture = TestBed.createComponent(StudiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
  }

  function createSpecificError(
    errorCode: string
  ): HttpErrorResponse & SpecificHttpError {
    return new HttpErrorResponse({
      error: {
        error: 'the error',
        errorCode,
        message: 'the message',
        statusCode: 403,
      },
    });
  }
});
