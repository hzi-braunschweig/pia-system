/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { DialogExportDataComponent } from './export-dialog.component';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
} from '@angular/material/datepicker';
import {
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField } from '@angular/material/form-field';
import { MatGridList, MatGridTile } from '@angular/material/grid-list';
import { MatSelect } from '@angular/material/select';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { MockComponent, MockDirective, MockModule, MockPipe } from 'ng-mocks';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingSpinnerComponent } from '../../features/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '@ngx-translate/core';
import { MatSelectSearchComponent } from '../../features/mat-select-search/mat-select-search.component';
import { MatOptionSelectAllComponent } from '../../features/mat-option-select-all/mat-option-select-all.component';
import {
  Questionnaire,
  QuestionnaireListResponse,
} from '../../psa.app.core/models/questionnaire';
import { By } from '@angular/platform-browser';
import { createProband } from '../../psa.app.core/models/instance.helper.spec';
import { ProbandService } from '../../psa.app.core/providers/proband-service/proband.service';
import { CurrentUser } from '../../_services/current-user.service';
import SpyObj = jasmine.SpyObj;
import Keycloak from 'keycloak-js';

describe('DialogExportDataComponent', () => {
  let component: DialogExportDataComponent;
  let fixture: ComponentFixture<DialogExportDataComponent>;

  let dialogRef: SpyObj<MatDialogRef<DialogExportDataComponent>>;
  let probandService: SpyObj<ProbandService>;
  let alertService: SpyObj<AlertService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let currentUser: SpyObj<CurrentUser>;
  let keycloak: SpyObj<Keycloak>;

  const proband1 = createProband({
    pseudonym: 'Testproband1',
    study: 'Teststudie1',
  });
  const proband2 = createProband({
    pseudonym: 'Testproband2',
    study: 'Teststudie2',
  });
  const proband3 = createProband({
    pseudonym: 'Testproband3',
    study: 'Teststudie2',
  });

  beforeEach(async () => {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    probandService = jasmine.createSpyObj('ProbandService', ['getProbands']);
    alertService = jasmine.createSpyObj('AlertService', [
      'error',
      'errorObject',
    ]);
    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getQuestionnaires',
      'getImageBy',
      'export',
    ]);
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      studies: ['Teststudie1', 'Teststudie2', 'Teststudie3'],
    });
    keycloak = jasmine.createSpyObj('Keycloak', [], { token: 'token' });
    probandService.getProbands.and.resolveTo([]);
    questionnaireService.getQuestionnaires.and.resolveTo(
      getQuestionnaireListResponse()
    );

    questionnaireService.export.and.returnValue();

    TestBed.configureTestingModule({
      declarations: [
        DialogExportDataComponent,
        MockPipe(TranslatePipe),
        MockComponent(LoadingSpinnerComponent),
        MockDirective(MatDialogTitle),
        MockDirective(MatDialogContent),
        MockComponent(MatGridList),
        MockComponent(MatGridTile),
        MockComponent(MatFormField),
        MockComponent(MatDatepicker),
        MockDirective(MatDatepickerInput),
        MockComponent(MatDatepickerToggle),
        MockComponent(MatSelect),
        MockComponent(MatSelectSearchComponent),
        MockComponent(MatOption),
        MockDirective(MatError),
        MockComponent(MatOptionSelectAllComponent),
        MockComponent(MatCheckbox),
        MockDirective(MatDialogActions),
        MockComponent(MatButton),
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: ProbandService, useValue: probandService },
        { provide: AlertService, useValue: alertService },
        { provide: QuestionnaireService, useValue: questionnaireService },
        { provide: CurrentUser, useValue: currentUser },
        { provide: Keycloak, useValue: keycloak },
      ],
      imports: [MockModule(ReactiveFormsModule)],
    });
    fixture = TestBed.createComponent(DialogExportDataComponent);
    component = fixture.componentInstance;

    await component.ngOnInit();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  describe('study selection', () => {
    it('should show all studies of users', () => {
      const options = fixture.debugElement.queryAll(
        By.css('[unit-study-option]')
      );
      expect(options.length).toEqual(3);
      expect(options[0].nativeElement.innerText.trim()).toEqual('Teststudie1');
      expect(options[1].nativeElement.innerText.trim()).toEqual('Teststudie2');
      expect(options[2].nativeElement.innerText.trim()).toEqual('Teststudie3');
    });

    it('should show an error if no study is chosen', () => {
      expect(
        fixture.debugElement.query(By.css('[unit-study-select-error]'))
      ).not.toBeNull();
    });
  });

  describe('questionnaire selection', () => {
    it('should show all questionnaires sorted by name and version within selected study', fakeAsync(() => {
      probandService.getProbands.and.resolveTo([proband1]);
      expect(component.form.get('questionnaires').enabled).toBeFalsy();

      tick();
      fixture.detectChanges();
      component.form.get('study_name').setValue('Teststudie1');

      tick();
      fixture.detectChanges();
      expect(component.form.get('questionnaires').enabled).toBeTruthy();

      const options = fixture.debugElement.queryAll(
        By.css('[unit-questionnaire-option]')
      );

      expect(options.length).toEqual(5);
      expect(options[0].nativeElement.innerText.trim()).toEqual(
        'Testfragebogen1 - V1'
      );
      expect(options[1].nativeElement.innerText.trim()).toEqual(
        'Testfragebogen2 - V1'
      );
      expect(options[2].nativeElement.innerText.trim()).toEqual(
        'Testfragebogen3 - V1'
      );
      expect(options[3].nativeElement.innerText.trim()).toEqual(
        'Testfragebogen3 - V2'
      );
      expect(options[4].nativeElement.innerText.trim()).toEqual(
        'Testfragebogen3 - V3'
      );
    }));

    it('should show an error if no questionnaire is chosen', fakeAsync(() => {
      expect(
        fixture.debugElement.query(By.css('[unit-questionnaire-select-error]'))
      ).not.toBeNull();
      component.form.get('study_name').setValue('Teststudie1');
      component.form.get('questionnaires').setValue('Testfragebogen2');
      tick();
      fixture.detectChanges();
      expect(
        fixture.debugElement.query(By.css('[unit-questionnaire-select-error]'))
      ).toBeNull();
    }));

    describe('when only codebook selected', () => {
      it('should only validate when questionnaire has been selected', fakeAsync(() => {
        component.form.get('study_name').setValue('Teststudie1');
        component.form.get('questionnaires').setValue(null);
        component.form
          .get('exports')
          .setValue([false, false, true, false, false, false, false]);
        tick();
        fixture.detectChanges();
        expect(component.form.valid).toBeFalsy();

        component.form.get('questionnaires').setValue(['Testfragebogen1']);
        tick();
        fixture.detectChanges();
        expect(component.form.valid).toBeTruthy();
      }));
    });
  });

  describe('proband selection', () => {
    it('should show all probands within selected study', fakeAsync(() => {
      probandService.getProbands.and.resolveTo([proband2, proband3]);
      expect(component.form.get('probands').enabled).toBeFalsy();
      const probandsSpy = jasmine.createSpy();
      component.probandsForSelection.subscribe(probandsSpy);
      component.form.get('study_name').setValue('Teststudie2');
      tick();
      fixture.detectChanges();
      expect(component.form.get('probands').enabled).toBeTruthy();
      expect(probandsSpy).toHaveBeenCalledWith([proband2, proband3]);
    }));

    it('should be disabled when only codebook export has been selected', fakeAsync(() => {
      expect(component.form.get('probands').enabled).toBeFalsy();
      component.form.get('study_name').setValue('Teststudie2');
      component.form.get('questionnaires').setValue(['Testfragebogen1']);
      component.form
        .get('exports')
        .setValue([false, false, true, false, false, false, false]);
      tick();
      fixture.detectChanges();
      expect(component.form.get('probands').enabled).toBeFalsy();
      component.submit();
      tick();
      expect(questionnaireService.export).toHaveBeenCalledTimes(1);
    }));

    it('should be disabled when only codebook and questionnaires export has been selected', fakeAsync(() => {
      expect(component.form.get('probands').enabled).toBeFalsy();
      component.form.get('study_name').setValue('Teststudie2');
      component.form.get('questionnaires').setValue(['Testfragebogen1']);
      component.form
        .get('exports')
        .setValue([false, false, true, true, false, false, false]);
      tick();
      fixture.detectChanges();
      expect(component.form.get('probands').enabled).toBeFalsy();
      component.submit();
      tick();
      expect(questionnaireService.export).toHaveBeenCalledTimes(1);
    }));
  });

  describe('submit()', () => {
    it('should call questionnaire service to get export data', fakeAsync(() => {
      component.form.get('study_name').setValue('Teststudie1');
      component.form.get('questionnaires').setValue(['Testfragebogen1']);
      component.form.get('probands').setValue('Testproband1');
      component.submit();
      tick();
      expect(questionnaireService.export).toHaveBeenCalledTimes(1);
      expect(questionnaireService.export).toHaveBeenCalledWith(
        {
          start_date: null,
          end_date: null,
          study_name: 'Teststudie1',
          questionnaires: ['Testfragebogen1'],
          probands: ['Testproband1'],
          exports: [
            'legacy_answers',
            'answers',
            'codebook',
            'questionnaires',
            'labresults',
            'samples',
            'bloodsamples',
            'settings',
          ],
        },
        'token'
      );
    }));

    it('should call questionnaire service to get export data with all probands of study', fakeAsync(() => {
      probandService.getProbands.and.resolveTo([proband2, proband3]);
      component.form.get('study_name').setValue('Teststudie2');
      component.form.get('questionnaires').setValue(['Testfragebogen4']);
      component.form.get('probands').setValue('allProbandsCheckbox');
      tick();
      component.submit();
      tick();
      expect(questionnaireService.export).toHaveBeenCalledTimes(1);
      expect(questionnaireService.export).toHaveBeenCalledWith(
        {
          start_date: null,
          end_date: null,
          study_name: 'Teststudie2',
          questionnaires: ['Testfragebogen4'],
          probands: ['Testproband2', 'Testproband3'],
          exports: [
            'legacy_answers',
            'answers',
            'codebook',
            'questionnaires',
            'labresults',
            'samples',
            'bloodsamples',
            'settings',
          ],
        },
        'token'
      );
    }));

    it('should do nothing if form is invalid', fakeAsync(() => {
      expect(component.form.errors).not.toBeNull();
      component.submit();
      tick();
      expect(questionnaireService.export).not.toHaveBeenCalled();
    }));
  });

  describe('form validity', () => {
    const testCases: {
      selections: {
        study?: boolean;
        questionnaires?: boolean;
        probands?: boolean;
      };
      exports: {
        legacy_answers?: boolean;
        answers?: boolean;
        codebook?: boolean;
        questionnaires?: boolean;
        labresults?: boolean;
        samples?: boolean;
        bloodsamples?: boolean;
        settings?: boolean;
      };
      valid: boolean;
    }[] = [
      {
        selections: {
          study: true,
          questionnaires: true,
          probands: true,
        },
        exports: {
          legacy_answers: true,
          answers: true,
          codebook: true,
          questionnaires: true,
          labresults: true,
          samples: true,
          bloodsamples: true,
          settings: true,
        },
        valid: true,
      },
      {
        selections: {
          study: false,
          questionnaires: false,
          probands: false,
        },
        exports: {
          legacy_answers: false,
          answers: false,
          codebook: false,
          questionnaires: false,
          labresults: false,
          samples: false,
          bloodsamples: false,
          settings: false,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          questionnaires: true,
        },
        exports: {
          questionnaires: true,
        },
        valid: true,
      },
      {
        selections: {
          questionnaires: false,
        },
        exports: {
          questionnaires: true,
        },
        valid: false,
      },
      {
        selections: {
          study: false,
        },
        exports: {
          questionnaires: true,
        },
        valid: false,
      },
      {
        selections: {},
        exports: {
          questionnaires: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
        },
        exports: {
          legacy_answers: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          questionnaires: true,
        },
        exports: {
          legacy_answers: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          questionnaires: true,
          probands: true,
        },
        exports: {
          legacy_answers: true,
        },
        valid: true,
      },
      {
        selections: {
          study: true,
        },
        exports: {
          answers: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          questionnaires: true,
        },
        exports: {
          answers: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          questionnaires: true,
          probands: true,
        },
        exports: {
          answers: true,
        },
        valid: true,
      },
      {
        selections: {
          study: true,
        },
        exports: {
          codebook: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          questionnaires: true,
        },
        exports: {
          codebook: true,
        },
        valid: true,
      },
      {
        selections: {
          study: true,
        },
        exports: {
          settings: true,
        },
        valid: false,
      },
      {
        selections: {
          study: true,
          probands: true,
        },
        exports: {
          settings: true,
        },
        valid: true,
      },
    ];

    testCases.forEach((testCase) => {
      const exports = Object.entries(testCase.exports)
        .filter(([, selected]) => selected)
        .map(([name]) => name);

      const selections = Object.entries(testCase.selections)
        .filter(([, selected]) => selected)
        .map(([name]) => name);

      const exportsString =
        exports.length === 0 ? 'nothing' : exports.join(', ');
      const selectionsString =
        selections.length === 0 ? 'nothing' : selections.join(', ');

      it(`should be ${
        testCase.valid ? 'valid' : 'invalid'
      } when exporting ${exportsString} and selected ${selectionsString}`, fakeAsync(() => {
        component.form
          .get('exports')
          .setValue([
            testCase.exports.legacy_answers ?? false,
            testCase.exports.answers ?? false,
            testCase.exports.codebook ?? false,
            testCase.exports.questionnaires ?? false,
            testCase.exports.labresults ?? false,
            testCase.exports.samples ?? false,
            testCase.exports.settings ?? false,
          ]);
        component.form
          .get('study_name')
          .setValue(testCase.selections.study ? 'Teststudie1' : null);
        component.form
          .get('questionnaires')
          .setValue(
            testCase.selections.questionnaires ? ['Testfragebogen1'] : null
          );
        component.form
          .get('probands')
          .setValue(
            testCase.selections.probands ? 'allProbandsCheckbox' : null
          );

        tick();
        fixture.detectChanges();
        if (testCase.valid) {
          expect(component.form.valid).toBeTruthy();
        } else {
          expect(component.form.valid).toBeFalsy();
        }
      }));
    });
  });

  function getQuestionnaireListResponse(): QuestionnaireListResponse {
    return {
      questionnaires: [
        { id: 1, study_id: 'Teststudie1', name: 'Testfragebogen1', version: 1 },
        { id: 2, study_id: 'Teststudie1', name: 'Testfragebogen2', version: 1 },
        { id: 3, study_id: 'Teststudie1', name: 'Testfragebogen3', version: 1 },
        { id: 4, study_id: 'Teststudie2', name: 'Testfragebogen4', version: 1 },
        { id: 7, study_id: 'Teststudie1', name: 'Testfragebogen3', version: 3 },
        { id: 6, study_id: 'Teststudie3', name: 'Testfragebogen5', version: 1 },
        { id: 5, study_id: 'Teststudie1', name: 'Testfragebogen3', version: 2 },
      ] as Questionnaire[],
      links: null,
    };
  }
});
