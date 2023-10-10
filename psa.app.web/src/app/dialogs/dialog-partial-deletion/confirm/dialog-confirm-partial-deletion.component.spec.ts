/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import {
  DialogConfirmPartialDeletionComponent,
  DialogConfirmPartialDeletionData,
  DialogConfirmPartialDeletionResult,
} from './dialog-confirm-partial-deletion.component';
import { AppModule } from '../../../app.module';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { mock } from 'ts-mockito';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { PendingPartialDeletionResponse } from '../../../psa.app.core/models/pendingPartialDeletion';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { LabResult } from '../../../psa.app.core/models/labresult';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('DialogConfirmPartialDeletionComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogConfirmPartialDeletionComponent;
  let dialogRef: MatDialogRef<DialogConfirmPartialDeletionComponent>;
  let data: DialogConfirmPartialDeletionData;
  let authService: SpyObj<AuthService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let sampleTrackingService: SpyObj<SampleTrackingService>;
  const pseudonym = 'Test-Proband';

  beforeEach(async () => {
    // Provider and Services
    data = {
      partialDeletionResponse: mock<PendingPartialDeletionResponse>(),
    };
    data.partialDeletionResponse.probandId = pseudonym;
    data.partialDeletionResponse.fromDate = new Date(5000);
    data.partialDeletionResponse.toDate = new Date(6000);
    dialogRef = createSpyObj<
      MatDialogRef<DialogConfirmPartialDeletionComponent>
    >(['close']);
    questionnaireService = createSpyObj<QuestionnaireService>([
      'getQuestionnaireInstancesForUser',
    ]);
    authService = createSpyObj<AuthService>([
      'putPendingPartialDeletion',
      'deletePendingPartialDeletion',
    ]);
    sampleTrackingService = createSpyObj<SampleTrackingService>([
      'getAllLabResultsForUser',
    ]);

    // Build Module
    await MockBuilder(DialogConfirmPartialDeletionComponent, AppModule)
      .provide({ provide: MatDialogRef, useValue: dialogRef })
      .provide({
        provide: MAT_DIALOG_DATA,
        useValue: data,
      })
      .mock(QuestionnaireService, questionnaireService)
      .mock(AuthService, authService)
      .mock(SampleTrackingService, sampleTrackingService);

    // Setup mocks before creating component
    questionnaireService.getQuestionnaireInstancesForUser.and.resolveTo([
      mock<QuestionnaireInstance>(),
    ]);
    sampleTrackingService.getAllLabResultsForUser.and.resolveTo([
      mock<LabResult>(),
    ]);

    // Create component
    fixture = MockRender(DialogConfirmPartialDeletionComponent);
    component = fixture.point.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('should execute the pending deletion and close the dialog when confirming', async () => {
    await component.confirmDeletion();
    expect(authService.putPendingPartialDeletion).toHaveBeenCalled();
    const result: DialogConfirmPartialDeletionResult = {
      probandId: pseudonym,
      successfullyConfirmed: true,
    };
    expect(dialogRef.close).toHaveBeenCalledWith(result);
  });

  it('should return an error and close the dialog when confirming fails', async () => {
    authService.putPendingPartialDeletion.and.rejectWith(new Error('test'));
    await component.confirmDeletion();
    expect(authService.putPendingPartialDeletion).toHaveBeenCalled();
    const result: DialogConfirmPartialDeletionResult = {
      probandId: pseudonym,
      successfullyConfirmed: false,
    };
    expect(dialogRef.close).toHaveBeenCalledWith(result);
  });

  it('should reject the pending deletion and close the dialog when rejecting', async () => {
    await component.rejectDeletion();
    expect(authService.deletePendingPartialDeletion).toHaveBeenCalled();
    const result: DialogConfirmPartialDeletionResult = {
      probandId: pseudonym,
      successfullyRejected: true,
    };
    expect(dialogRef.close).toHaveBeenCalledWith(result);
  });

  it('should return an error and close the dialog when rejecting fails', async () => {
    authService.deletePendingPartialDeletion.and.rejectWith(new Error('test'));
    await component.rejectDeletion();
    expect(authService.deletePendingPartialDeletion).toHaveBeenCalled();
    const result: DialogConfirmPartialDeletionResult = {
      probandId: pseudonym,
      successfullyRejected: false,
    };
    expect(dialogRef.close).toHaveBeenCalledWith(result);
  });
});
