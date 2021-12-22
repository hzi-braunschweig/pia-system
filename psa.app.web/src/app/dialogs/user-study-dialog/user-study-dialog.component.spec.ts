/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from 'src/app/app.module';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  DialogUserStudyAccessComponent,
  DialogUserStudyAccessComponentData,
  DialogUserStudyAccessComponentReturn,
} from './user-study-dialog';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { AuthService } from '../../psa.app.core/providers/auth-service/auth-service';
import { createProfessionalUser } from '../../psa.app.core/models/instance.helper.spec';
import { AlertService } from '../../_services/alert.service';
import { first } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { QuestionnaireService } from '../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import SpyObj = jasmine.SpyObj;

describe('DialogUserStudyAccessComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogUserStudyAccessComponent;
  let dialogRef: SpyObj<
    MatDialogRef<
      DialogUserStudyAccessComponent,
      DialogUserStudyAccessComponentReturn
    >
  >;
  let matDialog: SpyObj<MatDialog>;
  let alertService: SpyObj<AlertService>;
  let authService: SpyObj<AuthService>;
  let questionnaireService: SpyObj<QuestionnaireService>;

  beforeEach(async () => {
    // Provider and Services
    const data: DialogUserStudyAccessComponentData = {
      studyName: 'test study 1',
    };
    dialogRef = jasmine.createSpyObj(MatDialogRef, ['close']);
    matDialog = jasmine.createSpyObj(MatDialog, ['open']);
    alertService = jasmine.createSpyObj(AlertService, ['errorObject']);
    alertService.errorObject.and.callFake(console.error);
    authService = jasmine.createSpyObj(AuthService, ['getProfessionalUsers']);
    questionnaireService = jasmine.createSpyObj(QuestionnaireService, [
      'postStudyAccess',
    ]);

    // Build Base Module
    await MockBuilder(DialogUserStudyAccessComponent, AppModule)
      .provide({ provide: MatDialogRef, useValue: dialogRef })
      .provide({
        provide: MAT_DIALOG_DATA,
        useValue: data,
      })
      .mock(MatDialog, matDialog)
      .mock(AlertService, alertService)
      .mock(QuestionnaireService, questionnaireService)
      .mock(AuthService, authService);
  });

  beforeEach(fakeAsync(() => {
    // Setup mocks before creating component
    authService.getProfessionalUsers.and.resolveTo([
      createProfessionalUser({
        username: 'p1',
        study_accesses: [
          { study_id: 'test study 2', access_level: 'admin' },
          { study_id: 'test study 3', access_level: 'admin' },
        ],
      }),
      createProfessionalUser({
        username: 'p2',
        study_accesses: [{ study_id: 'test study 2', access_level: 'admin' }],
      }),
      createProfessionalUser({
        username: 'p3',
        study_accesses: [{ study_id: 'test study 1', access_level: 'admin' }],
      }),
      createProfessionalUser({
        username: 'p4',
        study_accesses: [],
      }),
    ]);
    questionnaireService.postStudyAccess.and.resolveTo();

    // Create component
    fixture = MockRender(DialogUserStudyAccessComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges();
  }));

  it('should create the component', () => {
    expect(component).toBeDefined();
    expect(authService.getProfessionalUsers).toHaveBeenCalled();
  });

  it('should filter by the username', fakeAsync(() => {
    const filterSpy1 = jasmine.createSpy();
    component.filteredUsers
      .pipe(first())
      .subscribe((users) => filterSpy1(users.length));
    tick();
    expect(filterSpy1).toHaveBeenCalledWith(3);

    component.usernameFilterCtrl.setValue('p4');

    const filterSpy2 = jasmine.createSpy();
    component.filteredUsers
      .pipe(first())
      .subscribe((users) => filterSpy2(users.length));
    tick();
    expect(filterSpy2).toHaveBeenCalledWith(1);
  }));

  it('should open a confirm dialog and post the access on submit', fakeAsync(() => {
    const internalDialogRef = jasmine.createSpyObj(MatDialogRef, [
      'afterClosed',
    ]);
    matDialog.open.and.returnValue(internalDialogRef);
    const closedObs = new Subject<string>();
    internalDialogRef.afterClosed.and.returnValue(closedObs);
    component.submit();
    expect(matDialog.open).toHaveBeenCalled();
    expect(questionnaireService.postStudyAccess).not.toHaveBeenCalled();

    closedObs.next('ok');
    tick();
    expect(questionnaireService.postStudyAccess).toHaveBeenCalled();
    expect(alertService.errorObject).not.toHaveBeenCalled();
  }));
});
