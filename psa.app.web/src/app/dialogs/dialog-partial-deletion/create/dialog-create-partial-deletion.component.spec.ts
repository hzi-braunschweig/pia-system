/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import {
  DialogCreatePartialDeletionComponent,
  DialogCreatePartialDeletionData,
  DialogCreatePartialDeletionResult,
} from './dialog-create-partial-deletion.component';
import { AppModule } from '../../../app.module';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { mock } from 'ts-mockito';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { LabResult } from '../../../psa.app.core/models/labresult';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogCreatePartialDeletionComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogCreatePartialDeletionComponent;
  let dialogRef: MatDialogRef<DialogCreatePartialDeletionComponent>;
  let authService: SpyObj<AuthService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let data: DialogCreatePartialDeletionData;

  beforeEach(async () => {
    // Provider and Services
    const q = mock<Questionnaire>();
    q.id = 2;
    q.version = 1;
    data = {
      dataForDelete: {
        startDate: new Date(5000),
        endDate: new Date(7000),
        labResults: [mock<LabResult>()],
        questionnaires: [q],
        userForApprove: 'Jack',
        probandId: 'Test-Proband',
      },
    };
    dialogRef = createSpyObj<
      MatDialogRef<DialogCreatePartialDeletionComponent>
    >(['close']);
    questionnaireService = createSpyObj<QuestionnaireService>([
      'getQuestionnaireInstancesForUser',
    ]);
    authService = createSpyObj<AuthService>(['postPendingPartialDeletion']);

    // Build Module
    await MockBuilder(DialogCreatePartialDeletionComponent, AppModule)
      .provide({ provide: MatDialogRef, useValue: dialogRef })
      .provide({
        provide: MAT_DIALOG_DATA,
        useValue: data,
      })
      .mock(QuestionnaireService, questionnaireService)
      .mock(AuthService, authService);

    // Setup mocks before creating component
    const qI1 = mock<QuestionnaireInstance>();
    const qI2 = mock<QuestionnaireInstance>();
    const qI3 = mock<QuestionnaireInstance>();
    const qI4 = mock<QuestionnaireInstance>();
    qI2.status = 'released_twice';
    qI2.date_of_release_v2 = new Date(4000);
    qI3.status = 'released_once';
    qI3.date_of_release_v1 = new Date(5000);
    qI3.questionnaire_id = 2;
    qI3.questionnaire_version = 1;
    qI4.status = 'released_twice';
    qI4.date_of_release_v2 = new Date(8000);
    questionnaireService.getQuestionnaireInstancesForUser.and.resolveTo([
      qI1,
      qI2,
      qI3,
      qI4,
    ]);

    // Create component
    fixture = MockRender(DialogCreatePartialDeletionComponent);
    component = fixture.point.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should post the pending deletion and close the dialog when confirming', async () => {
    await component.confirmDeletion();
    expect(authService.postPendingPartialDeletion).toHaveBeenCalled();
    const result: DialogCreatePartialDeletionResult = {
      successfullyCreated: true,
      probandId: data.dataForDelete.probandId,
      requestedFor: data.dataForDelete.userForApprove,
    };
    expect(dialogRef.close).toHaveBeenCalledWith(result);
  });

  it('should post the pending deletion and close the dialog when error appears', async () => {
    authService.postPendingPartialDeletion.and.rejectWith(new Error('test'));
    await component.confirmDeletion();
    expect(authService.postPendingPartialDeletion).toHaveBeenCalled();
    const result: DialogCreatePartialDeletionResult = {
      successfullyCreated: false,
      probandId: data.dataForDelete.probandId,
      requestedFor: data.dataForDelete.userForApprove,
    };
    expect(dialogRef.close).toHaveBeenCalledWith(result);
  });

  it('should close the dialog when canceling', async () => {
    await component.cancelDeletion();
    expect(dialogRef.close).toHaveBeenCalled();
  });
});
