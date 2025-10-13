/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/unbound-method */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatRadioGroupHarness } from '@angular/material/radio/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { AlertService } from 'src/app/_services/alert.service';
import { createStudy } from 'src/app/psa.app.core/models/instance.helper.spec';
import { PublishMode } from 'src/app/psa.app.core/models/questionnaireImport';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { UserService } from 'src/app/psa.app.core/providers/user-service/user.service';
import { DialogImportQuestionnaireComponentComponent } from './dialog-import-questionnaire-component.component';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('DialogImportQuestionnaireComponentComponent', () => {
  let component: DialogImportQuestionnaireComponentComponent;
  let fixture: ComponentFixture<DialogImportQuestionnaireComponentComponent>;
  let alertService: SpyObj<AlertService>;
  let userService: SpyObj<UserService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let loader: HarnessLoader;

  const studies = [
    createStudy({ name: 'Teststudy 1' }),
    createStudy({ name: 'Teststudy 2' }),
  ];

  beforeEach(async () => {
    alertService = createSpyObj<AlertService>(['errorObject']);
    userService = createSpyObj<UserService>(['getStudies']);
    questionnaireService = createSpyObj<QuestionnaireService>([
      'importQuestionnaire',
    ]);

    await TestBed.configureTestingModule({
      imports: [
        DialogImportQuestionnaireComponentComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        { provide: AlertService, useValue: alertService },
        { provide: UserService, useValue: userService },
        { provide: QuestionnaireService, useValue: questionnaireService },
      ],
    }).compileComponents();

    userService.getStudies.and.resolveTo(studies);

    fixture = TestBed.createComponent(
      DialogImportQuestionnaireComponentComponent
    );
    loader = TestbedHarnessEnvironment.loader(fixture);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(userService.getStudies).toHaveBeenCalled();
    expect(alertService.errorObject).not.toHaveBeenCalled();
    expect(questionnaireService.importQuestionnaire).not.toHaveBeenCalled();
  });

  it('should list all the studies in a dropdown', async () => {
    expect(component.studies).toEqual(studies);
    const studyDropdown = await loader.getHarness(
      MatSelectHarness.with({
        selector: '[data-unit="select-study-dropdown"]',
      })
    );
    await studyDropdown.open();

    fixture.detectChanges();
    const studyOptions = fixture.debugElement.queryAll(
      By.css('[data-unit="select-study-option"]')
    );
    expect(studyOptions.length).toEqual(studies.length);
  });

  it('should show radio buttons for the publish type', () => {
    const publishModeAdapt = fixture.debugElement.query(
      By.css('[data-unit="publish-mode-adapt"]')
    );
    expect(publishModeAdapt).toBeTruthy();

    const publishModeHidden = fixture.debugElement.query(
      By.css('[data-unit="publish-mode-hidden"]')
    );
    expect(publishModeHidden).toBeTruthy();
  });

  it('should run the import on pushing the button', async () => {
    const studyDropdown = await loader.getHarness(
      MatSelectHarness.with({
        selector: '[data-unit="select-study-dropdown"]',
      })
    );
    await studyDropdown.open();
    fixture.detectChanges();
    const studyOptions = await studyDropdown.getOptions();
    await studyOptions[0].click();
    fixture.detectChanges();

    const publishModeRadioGroup = loader.getHarness(
      MatRadioGroupHarness.with({
        selector: '[data-unit="publish-mode"]',
      })
    );
    await (
      await publishModeRadioGroup
    ).checkRadioButton({
      selector: '[data-unit="publish-mode-hidden"]',
    });
    fixture.detectChanges();

    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(
      new File(['{ "foo": "bar" }'], 'questionnaire.json', {
        type: 'application/json',
      })
    );

    const addFileSpy = spyOn(component, 'addFile').and.stub();
    const fileInput = fixture.debugElement.query(
      By.css('[data-unit="file-input"]')
    ).nativeElement as HTMLInputElement;
    fileInput.files = dataTransfer.files;
    fileInput.dispatchEvent(new InputEvent('change'));
    expect(addFileSpy).toHaveBeenCalled();
    addFileSpy.and.callThrough();
    await component.addFile();
    expect(component.form.valid).toBeTrue();

    const submitButton = fixture.debugElement.query(
      By.css('[data-unit="import-button"]')
    );
    expect(submitButton).toBeTruthy();
    (submitButton.nativeElement as HTMLButtonElement).click();
    expect(questionnaireService.importQuestionnaire).toHaveBeenCalledWith(
      studies[0].name,
      PublishMode.HIDDEN,
      [
        {
          name: 'questionnaire.json',
          content: '{ "foo": "bar" }',
        },
      ]
    );
  });

  it('should show a success icon if the import was successful', async () => {
    questionnaireService.importQuestionnaire.and.resolveTo({
      success: true,
    });
    component.form.setValue({
      study: studies[0].name,
      publishMode: PublishMode.HIDDEN,
      questionnaireFile: {
        name: 'questionnaire.json',
        content: '{ "foo": "bar" }',
      },
    });
    fixture.detectChanges();

    await component.submit();
    expect(component.importState).toBe('success');
    fixture.detectChanges();

    const icon = fixture.debugElement.query(
      By.css('[data-unit="import-success-icon"]')
    );
    expect(icon).toBeTruthy();
  });

  it('should show a warning icon if the import was not successful', async () => {
    questionnaireService.importQuestionnaire.and.resolveTo({
      success: false,
      errors: [
        {
          name: 'questionnaire.json',
          errorCode: 'IMPORT_JSON_SCHEMA_INVALID',
          message: 'JSON schema invalid',
        },
      ],
    });

    component.form.setValue({
      study: studies[0].name,
      publishMode: PublishMode.HIDDEN,
      questionnaireFile: {
        name: 'questionnaire.json',
        content: '{ "foo": "bar" }',
      },
    });
    fixture.detectChanges();

    await component.submit();
    expect(component.importState).toBe('error');
    fixture.detectChanges();

    const icon = fixture.debugElement.query(
      By.css('[data-unit="import-error-icon"]')
    );
    expect(icon).toBeTruthy();
  });
});
