/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import {
  DialogSelectForPartialDeletionComponent,
  DialogSelectForPartialDeletionData,
} from './dialog-select-for-partial-deletion.component';
import { AppModule } from '../../../app.module';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { mock } from 'ts-mockito';
import {
  Questionnaire,
  QuestionnaireListResponse,
} from '../../../psa.app.core/models/questionnaire';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { ProfessionalAccount } from '../../../psa.app.core/models/professionalAccount';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;
import Spy = jasmine.Spy;

describe('DialogSelectForPartialDeletionComponent', () => {
  let fixture: MockedComponentFixture;
  let component: DialogSelectForPartialDeletionComponent;
  let dialogRef: SpyObj<MatDialogRef<DialogSelectForPartialDeletionComponent>>;
  let userService: SpyObj<UserService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let sampleTrackingService: SpyObj<SampleTrackingService>;
  let data: DialogSelectForPartialDeletionData;
  let onInitSpy: Spy;

  beforeEach(async () => {
    // Provider and Services
    data = {
      probandId: 'username',
    };
    dialogRef = createSpyObj<
      MatDialogRef<DialogSelectForPartialDeletionComponent>
    >(['close']);
    questionnaireService = createSpyObj<QuestionnaireService>([
      'getQuestionnaires',
    ]);
    sampleTrackingService = createSpyObj<SampleTrackingService>([
      'getAllLabResultsForUser',
    ]);
    userService = createSpyObj<UserService>(['getProfessionalAccounts']);

    // Build Module
    await MockBuilder(DialogSelectForPartialDeletionComponent, AppModule)
      .provide({ provide: MatDialogRef, useValue: dialogRef })
      .provide({
        provide: MAT_DIALOG_DATA,
        useValue: data,
      })
      .mock(SampleTrackingService, sampleTrackingService)
      .mock(QuestionnaireService, questionnaireService)
      .mock(UserService, userService);

    // Setup mocks before creating component
    const q1 = mock<Questionnaire>();
    const q2 = mock<Questionnaire>();
    const q3 = mock<Questionnaire>();
    const q4 = mock<Questionnaire>();
    const resQ: QuestionnaireListResponse = {
      questionnaires: [q1, q2, q3, q4],
      links: null,
    };
    questionnaireService.getQuestionnaires.and.resolveTo(resQ);

    const labResult = mock<LabResult>();
    labResult.status = 'analyzed';
    sampleTrackingService.getAllLabResultsForUser.and.resolveTo([labResult]);

    const u1 = mock<ProfessionalAccount>();
    const u2 = mock<ProfessionalAccount>();
    u1.username = 'researcher@example.com';
    u2.username = 'researcherWithoutMail';
    const resU = [u1, u2];
    userService.getProfessionalAccounts.and.resolveTo(resU);

    // Create component
    onInitSpy = spyOn(
      DialogSelectForPartialDeletionComponent.prototype,
      'ngOnInit'
    ).and.callThrough();
    fixture = MockRender(DialogSelectForPartialDeletionComponent);
    component = fixture.point.componentInstance;
    await onInitSpy.calls.first().returnValue;
  });

  it('should create the component', async () => {
    expect(component).toBeDefined();
    expect(sampleTrackingService.getAllLabResultsForUser).toHaveBeenCalledTimes(
      1
    );
    expect(userService.getProfessionalAccounts).toHaveBeenCalledTimes(1);
    expect(questionnaireService.getQuestionnaires).toHaveBeenCalledTimes(1);
    expect(component.isLoading).toBeFalse();
  });

  describe('onDateRangeChanged', () => {
    it('should not change anything if startDate is before now', async () => {
      const startDate = new Date('2000-01-02');
      component.form.get('startDate').setValue(startDate);
      component.onDateRangeChanged(startDate);
      expect(component.form.get('startDate').value.getTime()).toEqual(
        startDate.getTime()
      );
      expect(component.form.get('endDate').value).toEqual(null);
    });
    it('should not change anything if endDate is after date 0', async () => {
      const endDate = new Date('2000-01-02');
      component.form.get('endDate').setValue(endDate);
      component.onDateRangeChanged(endDate);
      expect(component.form.get('startDate').value).toEqual(null);
      expect(component.form.get('endDate').value.getTime()).toEqual(
        endDate.getTime()
      );
    });
    it('should not change anything if endDate is after startDate', async () => {
      const startDate = new Date('2000-01-01');
      const endDate = new Date('2000-01-02');
      component.form.get('startDate').setValue(startDate);
      component.form.get('endDate').setValue(endDate);
      component.onDateRangeChanged(endDate);
      expect(component.form.get('startDate').value.getTime()).toEqual(
        startDate.getTime()
      );
      expect(component.form.get('endDate').value.getTime()).toEqual(
        endDate.getTime()
      );
    });
    it('should not change anything if startDate is before endDate', async () => {
      const startDate = new Date('2000-01-01');
      const endDate = new Date('2000-01-02');
      component.form.get('startDate').setValue(startDate);
      component.form.get('endDate').setValue(endDate);
      component.onDateRangeChanged(startDate);
      expect(component.form.get('startDate').value.getTime()).toEqual(
        startDate.getTime()
      );
      expect(component.form.get('endDate').value.getTime()).toEqual(
        endDate.getTime()
      );
    });
    it('should change the startDate if endDate is earlier', async () => {
      const startDate = new Date('2000-01-03');
      const endDate = new Date('2000-01-02');
      component.form.get('startDate').setValue(startDate);
      component.form.get('endDate').setValue(endDate);
      component.onDateRangeChanged(endDate);
      expect(component.form.get('startDate').value.getTime()).toEqual(
        endDate.getTime()
      );
      expect(component.form.get('endDate').value.getTime()).toEqual(
        endDate.getTime()
      );
    });
    it('should change the endDate if startDate is later', async () => {
      const startDate = new Date('2000-01-03');
      const endDate = new Date('2000-01-02');
      component.form.get('startDate').setValue(startDate);
      component.form.get('endDate').setValue(endDate);
      component.onDateRangeChanged(startDate);
      expect(component.form.get('startDate').value.getTime()).toEqual(
        startDate.getTime()
      );
      expect(component.form.get('endDate').value.getTime()).toEqual(
        startDate.getTime()
      );
    });
  });
  describe('submit', () => {
    it('should close validate and not close the dialog if not valid', async () => {
      component.form.get('userForApprove').setValue('researcherexamplecom');
      component.submit();
      expect(dialogRef.close).toHaveBeenCalledTimes(0);
    });
    it('should close validate and close the dialog', async () => {
      component.form.get('userForApprove').setValue('researcher@example.com');
      component.form
        .get('questionnaires')
        .setValue([
          'allQuestionnairesCheckbox',
          ...component.filteredQuestionnaires,
        ]);
      component.form
        .get('labResults')
        .setValue(['allLabResultsCheckbox', ...component.filteredLabResults]);
      component.submit();
      expect(dialogRef.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('onSelectAllQuestionnairesClicked', () => {
    it('should add all questionnaires to the form', async () => {
      expect(component.form.get('questionnaires').value.length).toEqual(0);
      const countQuestionnaires = component.filteredQuestionnaires.length;
      expect(countQuestionnaires).toBeGreaterThan(0);
      component.form
        .get('questionnaires')
        .setValue(['allQuestionnairesCheckbox']);
      component.onSelectAllQuestionnairesClicked();
      expect(component.form.get('questionnaires').value.length).toEqual(
        1 + countQuestionnaires
      );
    });
    it('should remove all questionnaires from the form if all were selected before', async () => {
      component.form
        .get('questionnaires')
        .setValue([
          'allQuestionnairesCheckbox',
          ...component.filteredQuestionnaires,
        ]);
      expect(component.form.get('questionnaires').value.length).toBeGreaterThan(
        1
      );
      component.onSelectAllQuestionnairesClicked();
      expect(component.form.get('questionnaires').value.length).toEqual(0);
    });
  });

  describe('onSelectAllLabResultsClicked', () => {
    it('should add all labResults to the form', async () => {
      expect(component.form.get('labResults').value.length).toEqual(0);
      const countLabResults = component.filteredLabResults.length;
      expect(countLabResults).toBeGreaterThan(0);
      component.form.get('labResults').setValue(['allLabResultsCheckbox']);
      component.onSelectAllLabResultsClicked();
      expect(component.form.get('labResults').value.length).toEqual(
        1 + countLabResults
      );
    });
    it('should remove all labResults from the form if all were selected before', async () => {
      component.form
        .get('labResults')
        .setValue(['allLabResultsCheckbox', ...component.filteredLabResults]);
      expect(component.form.get('labResults').value.length).toBeGreaterThan(1);
      component.onSelectAllLabResultsClicked();
      expect(component.form.get('labResults').value.length).toEqual(0);
    });
  });
});
