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
import { ComplianceResearcherComponent } from './compliance-researcher.component';
import { ComplianceService } from '../../../psa.app.core/providers/compliance-service/compliance-service';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { Studie } from '../../../psa.app.core/models/studie';
import { ComplianceTextInEditMode } from '../../../psa.app.core/models/compliance';
import { By } from '@angular/platform-browser';
import { MockComponents, MockModule, MockProvider } from 'ng-mocks';
import { ComplianceTextComponent } from './compliance-text/compliance-text.component';
import { ComplianceRadioComponent } from './compliance-radio/compliance-radio.component';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog/dialog-ref';
import { Observable } from 'rxjs';
import SpyObj = jasmine.SpyObj;

describe('ComplianceResearcherComponent', () => {
  let component: ComplianceResearcherComponent;
  let fixture: ComponentFixture<ComplianceResearcherComponent>;

  let alertService: jasmine.SpyObj<AlertService>;
  let complianceService: jasmine.SpyObj<ComplianceService>;
  let questionnaireService: jasmine.SpyObj<QuestionnaireService>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(fakeAsync(() => {
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    complianceService = jasmine.createSpyObj('ComplianceService', [
      'getComplianceTextForEditing',
      'updateComplianceText',
    ]);
    complianceService.getComplianceTextForEditing.and.resolveTo(
      getComplianceTextObject()
    );
    complianceService.updateComplianceText.and.resolveTo(
      getComplianceTextObject()
    );
    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getStudies',
    ]);
    questionnaireService.getStudies.and.resolveTo({ studies: getStudies() });
    const dialogRef: SpyObj<MatDialogRef<any>> = jasmine.createSpyObj([
      'afterClosed',
    ]);
    dialogRef.afterClosed.and.returnValue(new Observable());
    dialog = jasmine.createSpyObj('MatDialog', ['open']);
    dialog.open.and.returnValue(dialogRef);

    TestBed.configureTestingModule({
      providers: [
        MockProvider(QuestionnaireService, questionnaireService),
        MockProvider(AlertService, alertService),
        MockProvider(ComplianceService, complianceService),
        MockProvider(MatDialog, dialog),
      ],
      declarations: [
        ComplianceResearcherComponent,
        MockComponents(ComplianceTextComponent, ComplianceRadioComponent),
      ],
      imports: [
        MockModule(ReactiveFormsModule),
        MockModule(TranslateModule),
        MockModule(MatFormFieldModule),
        MockModule(MatSelectModule),
        MockModule(MatDividerModule),
        MockModule(MatCardModule),
        MockModule(MatRadioModule),
      ],
    });
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(ComplianceResearcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  }));

  describe('Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load the studies', () => {
      expect(component.studies).toEqual(getStudies());
    });

    it('should load the study text', fakeAsync(() => {
      const study = getStudies()[0];
      component.onSelectStudy(study);
      tick();
      expect(component.selectedStudy).toEqual(study);
      expect(
        complianceService.getComplianceTextForEditing
      ).toHaveBeenCalledWith(study.name);
      expect(component.complianceTextFG.value).toEqual(
        getComplianceTextObject()
      );
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('[unit-compliance-text]'))
      ).toBeTruthy();
    }));

    it('should be able to handle an empty answer from service', fakeAsync(() => {
      complianceService.getComplianceTextForEditing.and.resolveTo(null);
      component.onSelectStudy(getStudies()[0]);
      tick();
      expect(component.complianceTextFG.value.compliance_text).toBe('');
      expect(alertService.errorObject).toHaveBeenCalledTimes(0);
    }));
  });

  describe('Editing the Text', () => {
    it('should add a placeholder to the text', fakeAsync(() => {
      component.onSelectStudy(getStudies()[0]);
      tick();
      fixture.detectChanges();
      component.insertText(
        '<pia-consent-input-text-location></pia-consent-input-text-location>'
      );
      expect(component.complianceTextFG.value.compliance_text).toContain(
        '<pia-consent-input-text-location></pia-consent-input-text-location>'
      );
    }));
  });

  describe('Publishing the Text', () => {
    it('should ask for agreement if app consent placeholder is missing', fakeAsync(() => {
      component.onSelectStudy(getStudies()[0]);
      tick();
      fixture.detectChanges();
      component.complianceTextFG.controls.compliance_text.setValue(
        '# Hello please consent: \n'
      );
      component.onPublish();
      expect(dialog.open).toHaveBeenCalled();
      expect(complianceService.updateComplianceText).toHaveBeenCalledTimes(0);
    }));

    it('should call the service, update the text with the response and show the success message', fakeAsync(() => {
      component.onSelectStudy(getStudies()[0]);
      tick();
      fixture.detectChanges();
      component.insertText(
        '<pia-consent-input-radio-app></pia-consent-input-radio-app>'
      );
      component.onPublish();
      tick();
      expect(complianceService.updateComplianceText).toHaveBeenCalled();
      expect(dialog.open).toHaveBeenCalled();
      const dialogData = dialog.open.calls.argsFor(0)[1].data as {
        content: string;
        values?: object;
        isSuccess: boolean;
      };
      expect(dialogData.isSuccess).toBeTrue();
      expect(component.complianceTextFG.value).toEqual(
        getComplianceTextObject()
      );
    }));
  });

  function getStudies(): Studie[] {
    const studies = [new Studie(), new Studie()];
    studies[0].name = 'Teststudie1';
    studies[1].name = 'Teststudie2';
    return studies;
  }

  function getComplianceTextObject(): ComplianceTextInEditMode {
    return {
      to_be_filled_by: 'Proband',
      compliance_text:
        '# Hello please consent: \n <pia-consent-input-radio-app></pia-consent-input-radio-app>',
    };
  }
});
