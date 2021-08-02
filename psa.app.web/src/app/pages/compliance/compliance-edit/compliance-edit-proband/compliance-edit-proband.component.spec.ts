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
import { AuthenticationManager } from '../../../../_services/authentication-manager.service';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';
import { ComplianceManager } from '../../../../_services/compliance-manager.service';
import { AlertService } from '../../../../_services/alert.service';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';
import {
  ComplianceDataResponse,
  ComplianceText,
} from '../../../../psa.app.core/models/compliance';
import { LoadingSpinnerComponent } from '../../../../features/loading-spinner/loading-spinner.component';
import { MockComponents, MockModule, MockProvider } from 'ng-mocks';
import { TemplateModule } from '../../../../features/template-viewer/template.module';
import { LoadingSpinnerModule } from '../../../../features/loading-spinner/loading-spinner.module';
import { SegmentType } from '../../../../psa.app.core/models/Segments';
import SpyObj = jasmine.SpyObj;

class MockAuthManager {
  currentUser = {
    username: 'Testproband1',
  };
}

describe('ComplianceEditProbandComponent', () => {
  let component: ComplianceEditProbandComponent;
  let fixture: ComponentFixture<ComplianceEditProbandComponent>;
  let complianceService: SpyObj<ComplianceService>;
  let complianceManager: SpyObj<ComplianceManager>;
  let alertService: SpyObj<AlertService>;
  let dialog: SpyObj<MatDialog>;

  beforeEach(() => {
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getComplianceText',
      'getComplianceAgreementPdfForUser',
    ]);
    complianceManager = jasmine.createSpyObj('ComplianceManager', [
      'getComplianceAgreementForCurrentUser',
      'updateComplianceAgreementForCurrentUser',
    ]);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      declarations: [
        ComplianceEditProbandComponent,
        MockComponents(LoadingSpinnerComponent),
      ],
      providers: [
        { provide: AuthenticationManager, useClass: MockAuthManager },
        { provide: ComplianceService, useValue: complianceService },
        { provide: ComplianceManager, useValue: complianceManager },
        MockProvider(AlertService, alertService),
        MockProvider(MatDialog, dialog),
      ],
      imports: [
        MockModule(LoadingSpinnerModule),
        MockModule(TemplateModule),
        MockModule(MatExpansionModule),
        MockModule(TranslateModule),
      ],
    }).compileComponents();
  });

  function createComponent(
    username: string,
    complianceOfCurrent: ComplianceDataResponse,
    complianceOfOther: ComplianceDataResponse,
    complianceText: ComplianceText
  ): void {
    // mocks
    complianceManager.getComplianceAgreementForCurrentUser.and.resolveTo(
      complianceOfCurrent
    );
    complianceService.getComplianceText.and.resolveTo(complianceText);
    // create component
    fixture = TestBed.createComponent(ComplianceEditProbandComponent);
    component = fixture.componentInstance;
    component.username = username;
    component.study = 'Teststudie1';
    fixture.detectChanges(); // wait for ngOnInit
    tick(); // run ngOnInit
    fixture.detectChanges(); // wait for ngDoCheck
    tick(); // run ngDoCheck
  }

  function createComponentForEditMode(): void {
    createComponent('Testproband1', null, null, getComplianceText());
  }

  function createComponentForReadOnlyMode(): void {
    createComponent('Testproband1', getComplianceData(), null, null);
  }

  describe('Initialization', () => {
    it('should open in edit mode if no compliance exists', fakeAsync(() => {
      createComponentForEditMode();
      // check result
      expect(component.study).toEqual('Teststudie1');
      expect(component.studyWrapper.editMode).toBeTrue();
      expect(component.studyWrapper.complianceText).toEqual(
        getComplianceText().compliance_text
      );
      expect(component.studyWrapper.complianceTextObject).toEqual(
        getComplianceText().compliance_text_object
      );
      expect(
        complianceManager.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalledTimes(1);
    }));

    it('should open in read only mode if compliance exists', fakeAsync(() => {
      createComponentForReadOnlyMode();
      // check result
      expect(component.study).toEqual('Teststudie1');
      expect(component.studyWrapper.editMode).toBeFalse();
      expect(component.studyWrapper.complianceText).toEqual(null);
      expect(component.studyWrapper.complianceTextObject).toEqual(
        getComplianceData().compliance_text_object
      );
      expect(
        complianceManager.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalledTimes(1);
      // wait for ngDoCheck to be called
      tick();
      expect(component.studyWrapper.form.disabled).toBeTrue();
    }));

    it('should send any upcoming error to alert service', fakeAsync(() => {
      // mocks
      const err = new Error('Example error 1');
      complianceManager.getComplianceAgreementForCurrentUser.and.rejectWith(
        err
      );
      // create component
      fixture = TestBed.createComponent(ComplianceEditProbandComponent);
      component = fixture.componentInstance;
      component.username = 'Testproband1';
      component.study = 'Teststudie1';
      // wait for ngOnInit to be called
      fixture.detectChanges();
      tick();
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
      component.downloadPdf('Teststudie');
      tick();
      expect(
        complianceService.getComplianceAgreementPdfForUser
      ).toHaveBeenCalledWith('Teststudie', 'Testproband1');
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
      ).toHaveBeenCalledWith(
        {
          compliance_text: getComplianceText().compliance_text,
          textfields: {},
          compliance_system: {},
          compliance_questionnaire: [],
        },
        'Teststudie1'
      );
    }));
  });

  function getComplianceData(): ComplianceDataResponse {
    return {
      compliance_text_object: [
        { type: SegmentType.HTML, html: '<p>Lorem ipsum ... \n </p>' },
        {
          type: SegmentType.CUSTOM_TAG,
          attrs: [],
          children: [],
          tagName: 'pia-consent-input-app',
        },
      ],
      timestamp: undefined,
      textfields: {
        firstname: 'Michael',
        lastname: 'Myers',
        birthdate: new Date('01.01.1900'),
      },
      compliance_system: {
        app: true,
        samples: true,
        bloodsamples: false,
        labresults: false,
      },
      compliance_questionnaire: [
        { name: 'world-domination', value: true },
        { name: 'world-domination-memo', value: '' },
      ],
    };
  }

  function getComplianceText(): ComplianceText {
    return {
      compliance_text_object: [
        { type: SegmentType.HTML, html: '<p>Lorem ipsum ... \n </p>' },
        {
          type: SegmentType.CUSTOM_TAG,
          attrs: [],
          children: [],
          tagName: 'pia-consent-input-app',
        },
      ],
      compliance_text:
        'Lorem ipsum ... \n <pia-consent-input-app></pia-consent-input-app>',
    };
  }
});
