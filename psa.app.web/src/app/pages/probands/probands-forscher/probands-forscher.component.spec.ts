/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, fakeAsync } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MatLegacyDialog as MatDialog,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { By } from '@angular/platform-browser';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { Subject } from 'rxjs';
import { ProbandsForscherComponent } from './probands-forscher.component';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AppModule } from '../../../app.module';
import {
  DialogConfirmPartialDeletionComponent,
  DialogConfirmPartialDeletionData,
  DialogConfirmPartialDeletionResult,
} from '../../../dialogs/dialog-partial-deletion/confirm/dialog-confirm-partial-deletion.component';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from '../../../_helpers/dialog-pop-up';
import {
  DialogCreatePartialDeletionComponent,
  DialogCreatePartialDeletionResult,
} from '../../../dialogs/dialog-partial-deletion/create/dialog-create-partial-deletion.component';
import {
  DialogSelectForPartialDeletionComponent,
  DialogSelectForPartialDeletionResult,
} from '../../../dialogs/dialog-partial-deletion/select/dialog-select-for-partial-deletion.component';
import Spy = jasmine.Spy;
import createSpy = jasmine.createSpy;

describe('ProbandsForscherComponent', () => {
  let component: ProbandsForscherComponent;
  let fixture: ComponentFixture<ProbandsForscherComponent>;

  let routerNavigate: Spy;
  let activatedRoute;
  let dialogOpen: Spy;
  let getPendingPartialDeletionSpy: Spy;
  let afterClosedSubject: Subject<object>;

  beforeEach(async () => {
    activatedRoute = {
      snapshot: {
        queryParamMap: new Map<string, string>([
          ['pendingPartialDeletionId', '1234'],
          ['probandId', 'TEST-500'],
        ]),
      },
    };

    afterClosedSubject = new Subject();

    await MockBuilder(ProbandsForscherComponent, AppModule).mock(
      ActivatedRoute,
      activatedRoute
    );
    routerNavigate = MockInstance(Router, 'navigate', createSpy());
    dialogOpen = MockInstance(
      MatDialog,
      'open',
      createSpy().and.returnValue({
        afterClosed: () => afterClosedSubject.asObservable(),
      } as MatDialogRef<object>)
    );
    getPendingPartialDeletionSpy = MockInstance(
      AuthService,
      'getPendingPartialDeletion',
      createSpy().and.resolveTo(null)
    );

    fixture = MockRender(ProbandsForscherComponent);
    component = fixture.componentInstance;
  });

  describe('create component with pending partial deletion', () => {
    it('should open the view dialog', () => {
      expect(getPendingPartialDeletionSpy).toHaveBeenCalledWith(1234);
      expect(dialogOpen).toHaveBeenCalledTimes(1);
      const data: DialogConfirmPartialDeletionData = {
        partialDeletionResponse: null,
      };
      expect(dialogOpen).toHaveBeenCalledWith(
        DialogConfirmPartialDeletionComponent,
        {
          width: '800px',
          data,
        }
      );
    });

    it('should display the success deleted message', () => {
      const result: DialogConfirmPartialDeletionResult = {
        successfullyConfirmed: true,
        probandId: 'TEST-500',
      };
      afterClosedSubject.next(result);
      const data: DialogPopUpData = {
        content: 'DIALOG.PARTIAL_DELETION.SUCCESSFULLY_DELETED',
        values: { probandUsername: result.probandId },
        isSuccess: true,
      };
      expect(dialogOpen).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data,
      });
    });

    it('should display the success rejected message', () => {
      const result: DialogConfirmPartialDeletionResult = {
        successfullyRejected: true,
        probandId: 'TEST-500',
      };
      afterClosedSubject.next(result);
      const data: DialogPopUpData = {
        content: 'DIALOG.PARTIAL_DELETION.SUCCESSFULLY_REJECTED',
        values: { probandUsername: result.probandId },
        isSuccess: true,
      };
      expect(dialogOpen).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data,
      });
    });

    it('should display an error message', () => {
      const result: DialogConfirmPartialDeletionResult = {
        successfullyConfirmed: false,
        probandId: 'TEST-500',
      };
      afterClosedSubject.next(result);
      const data: DialogPopUpData = {
        content: 'DIALOG.ERROR_DELETE_CONFIRMATION',
        isSuccess: false,
      };
      expect(dialogOpen).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data,
      });
    });
  });

  describe('page header button', () => {
    it('should present a button to export data', () => {
      dialogOpen.calls.reset();
      clickButton('[unit-export-data]');
      expect(dialogOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('probands list entry actions', () => {
    it('should present a button to view answers', () => {
      clickButton('[unit-view-answers]');
      expect(routerNavigate).toHaveBeenCalledWith([
        '/questionnaireInstances/',
        undefined,
      ]);
    });

    it('should present a button to view labresults', fakeAsync(() => {
      clickButton('[unit-view-labresults]');
      expect(routerNavigate).toHaveBeenCalledWith([
        '/laboratory-results/',
        { user_id: undefined },
      ]);
    }));

    it('should present a button to view samples', () => {
      clickButton('[unit-view-samples]');
      expect(routerNavigate).toHaveBeenCalledWith([
        '/sample-management/',
        undefined,
      ]);
    });

    it('should present a button to delete probands data', () => {
      dialogOpen.calls.reset();
      clickButton('[unit-delete]');
      expect(dialogOpen).toHaveBeenCalledTimes(1);
    });
  });

  describe('create new pending partial deletion', () => {
    function fillTheSelectionDialog(username): void {
      // open the selection dialog
      component.openSelectDataForPartialDeletionDialog(username);
      expect(dialogOpen).toHaveBeenCalledWith(
        DialogSelectForPartialDeletionComponent,
        {
          width: '800px',
          data: { probandId: username },
        }
      );
      // confirm the selection and open the overview dialog
      const result: DialogSelectForPartialDeletionResult = {
        startDate: undefined,
        endDate: undefined,
        labResults: [],
        questionnaires: [],
        userForApprove: '',
        probandId: username,
      };
      afterClosedSubject.next(result);
      expect(dialogOpen).toHaveBeenCalledWith(
        DialogCreatePartialDeletionComponent,
        {
          width: '800px',
          data: {
            dataForDelete: result,
          },
        }
      );
    }

    it('should open the selection dialog, open the overview and show success', () => {
      const username = 'test-proband';
      const requestedForUser = 'TheOtherOne2';
      fillTheSelectionDialog(username);
      // confirm to create the pending deletion and open the success dialog
      const result: DialogCreatePartialDeletionResult = {
        probandId: username,
        requestedFor: requestedForUser,
        successfullyCreated: true,
      };
      afterClosedSubject.next(result);
      const data: DialogPopUpData = {
        content: 'DIALOG.PARTIAL_DELETION.SUCCESSFULLY_REQUESTED',
        values: {
          probandUsername: username,
          requestedFor: requestedForUser,
        },
        isSuccess: true,
      };
      expect(dialogOpen).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data,
      });
    });

    it('should open the selection dialog, open the overview and show an error', () => {
      const username = 'test-proband2';
      const requestedForUser = 'TheOtherOne2';
      fillTheSelectionDialog(username);
      // confirm to create the pending deletion and open the success dialog
      const result: DialogCreatePartialDeletionResult = {
        probandId: username,
        requestedFor: requestedForUser,
        successfullyCreated: false,
      };
      afterClosedSubject.next(result);
      const data: DialogPopUpData = {
        content: 'DIALOG.ERROR_DELETE_REQUEST',
        isSuccess: false,
      };
      expect(dialogOpen).toHaveBeenCalledWith(DialogPopUpComponent, {
        width: '300px',
        data,
      });
    });
  });

  function clickButton(selector): void {
    const button = fixture.debugElement.query(By.css(selector));
    expect(button).toBeDefined();
    button.nativeElement.click();
  }
});
