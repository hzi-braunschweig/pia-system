import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { ComplianceEditExaminerComponent } from './compliance-edit-examiner.component';
import { ComplianceService } from '../../../../psa.app.core/providers/compliance-service/compliance-service';
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

describe('ComplianceEditExaminerComponent', () => {
  let component: ComplianceEditExaminerComponent;
  let fixture: ComponentFixture<ComplianceEditExaminerComponent>;
  let complianceService: SpyObj<ComplianceService>;
  let alertService: SpyObj<AlertService>;
  let dialog: SpyObj<MatDialog>;

  beforeEach(() => {
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getComplianceText',
      'getComplianceAgreementForUser',
      'createComplianceAgreementForUser',
    ]);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      declarations: [
        ComplianceEditExaminerComponent,
        MockComponents(LoadingSpinnerComponent),
      ],
      providers: [
        { provide: ComplianceService, useValue: complianceService },
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
    compliance: ComplianceDataResponse,
    complianceText: ComplianceText
  ): void {
    // mocks
    complianceService.getComplianceAgreementForUser.and.resolveTo(compliance);
    complianceService.getComplianceText.and.resolveTo(complianceText);
    // create component
    fixture = TestBed.createComponent(ComplianceEditExaminerComponent);
    component = fixture.componentInstance;
    component.username = username;
    component.study = 'Teststudie1';
    fixture.detectChanges(); // wait for ngOnInit
    tick(); // run ngOnInit
    fixture.detectChanges(); // wait for ngDoCheck
    tick(); // run ngDoCheck
  }

  function createComponentForEditMode(): void {
    createComponent('Testproband1', null, getComplianceText());
  }

  function createComponentForAlreadyFilledCompliance(): void {
    createComponent('Testproband1', getEmptyComplianceData(), null);
  }

  describe('Initialization', () => {
    it('should init a study wrapper', fakeAsync(() => {
      createComponentForEditMode();
      // check result
      expect(component.username).toEqual('Testproband1');
      expect(new MockAuthManager().currentUser.username).toEqual(
        'Testproband1'
      );
      expect(component.study).toEqual('Teststudie1');
      expect(component.studyWrapper.editMode).toBeTrue();
      expect(component.studyWrapper.complianceText).toEqual(
        getComplianceText().compliance_text
      );
      expect(component.studyWrapper.complianceTextObject).toEqual(
        getComplianceText().compliance_text_object
      );
      expect(
        complianceService.getComplianceAgreementForUser
      ).toHaveBeenCalledTimes(1);
    }));

    it('should init no study wrapper if compliance was already filled', fakeAsync(() => {
      createComponentForAlreadyFilledCompliance();
      // check result
      expect(component.username).toEqual('Testproband1');
      expect(new MockAuthManager().currentUser.username).toEqual(
        'Testproband1'
      );
      expect(component.study).toEqual('Teststudie1');
      expect(component.studyWrapper).toBeUndefined();
      expect(
        complianceService.getComplianceAgreementForUser
      ).toHaveBeenCalledTimes(1);
    }));

    it('should send any upcoming error to alert service', fakeAsync(() => {
      // mocks
      const err = new Error('Example error');
      complianceService.getComplianceAgreementForUser.and.rejectWith(err);
      // create component
      fixture = TestBed.createComponent(ComplianceEditExaminerComponent);
      component = fixture.componentInstance;
      component.username = 'Testproband1';
      component.study = 'Teststudie1';
      // wait for ngOnInit to be called
      fixture.detectChanges();
      tick();
      // check result
      expect(component).toBeTruthy();
      expect(
        complianceService.getComplianceAgreementForUser
      ).toHaveBeenCalledTimes(1);
      expect(alertService.errorObject).toHaveBeenCalledTimes(1);
      expect(alertService.errorObject).toHaveBeenCalledWith(err);
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
        complianceService.createComplianceAgreementForUser
      ).toHaveBeenCalledTimes(1);
      expect(
        complianceService.createComplianceAgreementForUser
      ).toHaveBeenCalledWith('Teststudie1', 'Testproband1', {
        compliance_text: getComplianceText().compliance_text,
        textfields: {},
        compliance_system: {},
        compliance_questionnaire: [],
      });
    }));
  });

  function getEmptyComplianceData(): ComplianceDataResponse {
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
      textfields: null,
      compliance_system: null,
      compliance_questionnaire: null,
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
