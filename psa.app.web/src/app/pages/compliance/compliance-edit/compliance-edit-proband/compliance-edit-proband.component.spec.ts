/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ComplianceEditProbandComponent } from './compliance-edit-proband.component';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';
import { ComplianceManager } from '../../../../_services/compliance-manager.service';
import { AlertService } from '../../../../_services/alert.service';
import {
  ComplianceDataResponse,
  ComplianceText,
} from '../../../../psa.app.core/models/compliance';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../../../../app.module';
import { AuthenticationManager } from '../../../../_services/authentication-manager.service';
import {
  createComplianceDataResponse,
  createComplianceText,
} from '../../../../psa.app.core/models/instance.helper.spec';
import SpyObj = jasmine.SpyObj;

describe('ComplianceEditProbandComponent', () => {
  let component: ComplianceEditProbandComponent;
  let fixture: ComponentFixture<ComplianceEditProbandComponent>;
  let complianceService: SpyObj<ComplianceService>;
  let complianceManager: SpyObj<ComplianceManager>;
  let auth: SpyObj<AuthenticationManager>;
  let alertService: SpyObj<AlertService>;

  beforeEach(async () => {
    // Provider and Services
    complianceService = jasmine.createSpyObj<ComplianceService>(
      'ComplianceService',
      ['getComplianceText', 'getComplianceAgreementPdfForUser']
    );
    complianceManager = jasmine.createSpyObj<ComplianceManager>(
      'ComplianceManager',
      [
        'getComplianceAgreementForCurrentUser',
        'updateComplianceAgreementForCurrentUser',
      ]
    );
    auth = jasmine.createSpyObj<AuthenticationManager>(
      'AuthenticationManager',
      ['getCurrentStudy', 'getCurrentUsername']
    );
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);

    // Build Base Module
    await MockBuilder(ComplianceEditProbandComponent, AppModule)
      .mock(ComplianceService, complianceService)
      .mock(ComplianceManager, complianceManager)
      .mock(AlertService, alertService)
      .mock(AuthenticationManager, auth);
  });

  function createComponent(
    username: string,
    complianceOfCurrent: ComplianceDataResponse,
    complianceOfOther: ComplianceDataResponse,
    complianceText: ComplianceText
  ): void {
    // Setup mocks before creating component
    auth.getCurrentUsername.and.returnValue(username);
    auth.getCurrentStudy.and.returnValue('Teststudy');
    complianceManager.getComplianceAgreementForCurrentUser.and.resolveTo(
      complianceOfCurrent
    );
    complianceService.getComplianceText.and.resolveTo(complianceText);

    // Create component
    fixture = TestBed.createComponent(ComplianceEditProbandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // run ngOnInit
    tick(); // wait for ngOnInit to finish
    fixture.detectChanges(); // run ngDoCheck
  }

  function createComponentForEditMode(): void {
    createComponent('Testproband1', null, null, createComplianceText());
  }

  function createComponentForReadOnlyMode(): void {
    createComponent('Testproband1', createComplianceDataResponse(), null, null);
  }

  describe('Initialization', () => {
    it('should open in edit mode if no compliance exists', fakeAsync(() => {
      createComponentForEditMode();
      // check result
      expect(component.study).toEqual('Teststudy');
      expect(component.studyWrapper.editMode).toBeTrue();
      expect(component.studyWrapper.complianceText).toEqual(
        createComplianceText().compliance_text
      );
      expect(component.studyWrapper.complianceTextObject).toEqual(
        createComplianceText().compliance_text_object
      );
      expect(
        complianceManager.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalledTimes(1);
    }));

    it('should open in read only mode if compliance exists', fakeAsync(() => {
      createComponentForReadOnlyMode();
      // check result
      expect(component.study).toEqual('Teststudy');
      expect(component.studyWrapper.editMode).toBeFalse();
      expect(component.studyWrapper.complianceText).toEqual(null);
      expect(component.studyWrapper.complianceTextObject).toEqual(
        createComplianceDataResponse().compliance_text_object
      );
      expect(
        complianceManager.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalledTimes(1);
      expect(component.studyWrapper.form.disabled).toBeTrue();
    }));

    it('should send any upcoming error to alert service', fakeAsync(() => {
      // mocks
      const err = new Error('Example error 1');
      complianceManager.getComplianceAgreementForCurrentUser.and.rejectWith(
        err
      );
      // Create component
      fixture = TestBed.createComponent(ComplianceEditProbandComponent);
      component = fixture.componentInstance;
      fixture.detectChanges(); // run ngOnInit
      tick(); // wait for ngOnInit to finish
      // check result
      expect(component).toBeTruthy();
      expect(
        complianceManager.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalledTimes(1);
      expect(alertService.errorObject).toHaveBeenCalledTimes(1);
      expect(alertService.errorObject).toHaveBeenCalledWith(err);
    }));
  });

  describe('PDF Download', () => {
    it('should fill the studies array and open in read only mode if compliance exists', fakeAsync(() => {
      createComponentForReadOnlyMode();
      expect(component).toBeTruthy();
      component.downloadPdf();
      tick();
      expect(
        complianceService.getComplianceAgreementPdfForUser
      ).toHaveBeenCalledWith('Teststudy', 'Testproband1');
    }));
  });

  describe('Submitting the new compliance', () => {
    it('should extract all the data from the component and send it', fakeAsync(() => {
      createComponentForEditMode();
      component.studyWrapper.usedFormControls = new Map();

      expect(component.studyWrapper).toBeTruthy();
      expect(component.studyWrapper.form.valid);

      component.onSubmit(component.studyWrapper);

      expect(
        complianceManager.updateComplianceAgreementForCurrentUser
      ).toHaveBeenCalledTimes(1);
      expect(
        complianceManager.updateComplianceAgreementForCurrentUser
      ).toHaveBeenCalledWith({
        compliance_text: createComplianceText().compliance_text,
        textfields: {},
        compliance_system: {},
        compliance_questionnaire: [],
      });
    }));
  });
});
