/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { StudyChangeService } from './study-change.service';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;
import { DialogStudyComponent } from '../../dialogs/study-dialog/study-dialog';
import { createStudy } from '../../psa.app.core/models/instance.helper.spec';
import { Study } from '../../psa.app.core/models/study';
import { DialogChangeStudyComponent } from '../../dialogs/dialog-change-study/dialog-change-study.component';
import { DialogPopUpComponent } from '../../_helpers/dialog-pop-up';
import { HttpErrorResponse } from '@angular/common/http';
import { SpecificHttpError } from '../../psa.app.core/models/specificHttpError';
import { DialogYesNoComponent } from '../../dialogs/dialog-yes-no/dialog-yes-no';

describe('StudyChangeService', () => {
  let service: StudyChangeService;

  let authService: SpyObj<AuthService>;
  let dialog: SpyObj<MatDialog>;
  let afterClosedSubject: Subject<
    Study | string | (HttpErrorResponse & SpecificHttpError)
  >;

  beforeEach(() => {
    authService = createSpyObj<AuthService>('AuthService', [
      'deletePendingStudyChange',
    ]);
    authService.deletePendingStudyChange.and.resolveTo();
    afterClosedSubject = new Subject();
    dialog = createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({
      afterClosed: () => afterClosedSubject.asObservable(),
    } as MatDialogRef<any>);

    TestBed.configureTestingModule({
      providers: [
        MockProvider(AuthService, authService),
        MockProvider(MatDialog, dialog),
        MockProvider(MatDialog, dialog),
      ],
    });
    service = TestBed.inject(StudyChangeService);
  });

  describe('changeStudyAsSysAdmin', () => {
    it('should open DialogStudyComponent', () => {
      // Arrange
      const studyName = 'Teststudy';

      // Act
      service.changeStudyAsSysAdmin(studyName);

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogStudyComponent, {
        width: '500px',
        data: { name: studyName },
      });
    });

    it('should return an Observable which emits the study if study was changed', fakeAsync(() => {
      // Arrange
      const study = createStudy();
      const success = jasmine.createSpy();

      // Act
      service.changeStudyAsSysAdmin(study.name).subscribe(success);
      afterClosedSubject.next(study);
      tick();

      // Assert
      expect(success).toHaveBeenCalledWith(study);
    }));
  });

  describe('requestStudyChange', () => {
    it('should open the change study dialog', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      service.requestStudyChange(study).subscribe();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogChangeStudyComponent, {
        width: '700px',
        height: 'auto',
        data: { study },
      });
    }));

    it('should handle "requested" result', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      service.requestStudyChange(study).subscribe();
      afterClosedSubject.next('requested');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
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
      service.requestStudyChange(study).subscribe();
      afterClosedSubject.next(createSpecificError('MISSING_PERMISSION'));
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
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
      service.requestStudyChange(study).subscribe();
      afterClosedSubject.next(
        createSpecificError('4_EYE_OPPOSITION.PENDING_CHANGE_ALREADY_EXISTS')
      );
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
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
      service.requestStudyChange(study).subscribe();
      afterClosedSubject.next(
        createSpecificError('4_EYE_OPPOSITION.REQUESTED_FOR_NOT_REACHED')
      );
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
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
      service.requestStudyChange(study).subscribe();
      afterClosedSubject.next(
        createSpecificError('STUDY.INVALID_PSEUDONYM_PREFIX')
      );
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
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
      service.requestStudyChange(study).subscribe();
      afterClosedSubject.next('some unknown error');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'ERROR.ERROR_UNKNOWN',
          isSuccess: false,
        },
      });
    }));
  });

  describe('reviewPendingStudyChange', () => {
    it('should open the change study dialog', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      service.reviewPendingStudyChange(study).subscribe();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogChangeStudyComponent, {
        width: '700px',
        height: 'auto',
        data: { study },
      });
    }));

    it('should handle "rejected" result', fakeAsync(() => {
      // Arrange
      const study = createStudy();

      // Act
      service.reviewPendingStudyChange(study).subscribe();
      afterClosedSubject.next('rejected');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
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
      service.reviewPendingStudyChange(study).subscribe();
      afterClosedSubject.next('accepted');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.CHANGE_COMPLIANCES_ACCEPTED',
          isSuccess: true,
        },
      });
    }));
  });

  describe('cancelPendingStudyChange', () => {
    it('should open the cancel pending study change dialog', fakeAsync(() => {
      // Arrange
      const pendingStudyChangeId = 1234;

      // Act
      service.cancelPendingStudyChange(pendingStudyChangeId).subscribe();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogYesNoComponent, {
        data: { content: 'STUDY.CANCEL_CHANGES_CONFIRMATION_QUESTION' },
      });
    }));

    it('should request the pending study change deletion if "yes" was returned', fakeAsync(() => {
      // Arrange
      const pendingStudyChangeId = 1234;

      // Act
      service.cancelPendingStudyChange(pendingStudyChangeId).subscribe();
      afterClosedSubject.next('yes');
      tick();

      // Assert
      expect(authService.deletePendingStudyChange).toHaveBeenCalledWith(
        pendingStudyChangeId
      );
    }));

    it('should show a successful result dialog', fakeAsync(() => {
      // Arrange
      const pendingStudyChangeId = 1234;

      // Act
      service.cancelPendingStudyChange(pendingStudyChangeId).subscribe();
      afterClosedSubject.next('yes');
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data: {
          content: 'STUDIES.CHANGE_COMPLIANCES_REJECTED',
          isSuccess: true,
        },
      });
    }));

    it('should not request the pending study change deletion if "yes" was not returned', fakeAsync(() => {
      // Arrange
      const pendingStudyChangeId = 1234;

      // Act
      service.cancelPendingStudyChange(pendingStudyChangeId).subscribe();
      afterClosedSubject.next(undefined);
      tick();

      // Assert
      expect(authService.deletePendingStudyChange).not.toHaveBeenCalled();
    }));
  });

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
