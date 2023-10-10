/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { APP_DATE_FORMATS, AppDateAdapter } from '../../_helpers/date-adapter';
import { combineLatest, concatMap, Observable, tap } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { HttpEvent, HttpResponse } from '@angular/common/http';
import { Proband } from '../../psa.app.core/models/proband';
import { CurrentUser } from '../../_services/current-user.service';
import { ProbandService } from '../../psa.app.core/providers/proband-service/proband.service';

interface StudyQuestionnaire {
  id: number;
  study_id: string;
  name: string;
  version: number;
}

@Component({
  selector: 'app-dialog-export-data',
  templateUrl: 'export-dialog.component.html',
  styleUrls: ['export-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS,
    },
  ],
})
export class DialogExportDataComponent implements OnInit {
  exportCheckboxes = [
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_ANSWERS',
      value: 'legacy_answers',
      requiresProbandSelection: true,
    },
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_ANSWERS_IMPROVED',
      value: 'answers',
      requiresProbandSelection: true,
    },
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_CODEBOOK',
      value: 'codebook',
      requiresProbandSelection: false,
    },
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_QUESTIONNAIRE',
      value: 'questionnaires',
      requiresProbandSelection: false,
    },
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_LABRESULTS',
      value: 'labresults',
      requiresProbandSelection: true,
    },
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_SAMPLES',
      value: 'samples,bloodsamples',
      requiresProbandSelection: true,
    },
    {
      name: 'QUESTIONNAIRE_FORSCHER.EXPORT_SETTINGS',
      value: 'settings',
      requiresProbandSelection: true,
    },
  ];

  form: FormGroup = this.getExportForm();

  studiesForSelection: string[] = this.currentUser.studies;
  questionnairesForSelection: Observable<StudyQuestionnaire[]>;
  probandsForSelection: Observable<Proband[]>;
  allProbandsOfSelectedStudy: string[];

  probandFilterCtrl: FormControl = new FormControl();
  questionnaireFilterCtrl: FormControl = new FormControl();

  currentDate = new Date();
  isLoading: boolean = false;

  private static containsSearchValue(
    value: string,
    searchValue: string
  ): boolean {
    return (
      !searchValue || value.toLowerCase().includes(searchValue.toLowerCase())
    );
  }

  constructor(
    public dialogRef: MatDialogRef<DialogExportDataComponent>,
    private probandService: ProbandService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private currentUser: CurrentUser
  ) {}

  async ngOnInit(): Promise<void> {
    await this.fetchSelectionData();
    this.resetSelectionOnStudyChange();
    this.controlProbandSelectionOnExportsChange();
  }

  onStartDateChange(): void {
    const start = this.form.get('start_date').value;
    const end = this.form.get('end_date').value;
    if (end && start && end < start) {
      this.form.get('end_date').setValue(start);
    }
  }

  submit(): void {
    if (!this.form.valid) {
      return;
    }

    this.isLoading = true;

    const exportRequestData = this.form.getRawValue();

    if (this.isProbandSelectionRequired(this.form)) {
      if (exportRequestData.probands === 'allProbandsCheckbox') {
        exportRequestData.probands = this.allProbandsOfSelectedStudy;
      } else if (typeof exportRequestData.probands === 'string') {
        exportRequestData.probands = [this.form.get('probands').value];
      }
    } else {
      exportRequestData.probands = [];
    }

    // we allow an export checkbox to set multiple exports, separated by comma
    exportRequestData.exports = this.getExports()
      .map((value: string) =>
        value.search(',') >= 0 ? value.split(',') : value
      )
      .flatMap((v) => v);

    const responseStream =
      this.questionnaireService.getExportData(exportRequestData);
    this.saveExportFile(responseStream);
  }

  saveExportFile(responseStream: Observable<HttpEvent<Blob>>): void {
    responseStream.subscribe({
      next: async (response: HttpResponse<Blob>) => {
        const downloadLink = document.createElement('a');
        downloadLink.href = window.URL.createObjectURL(response.body);
        downloadLink.setAttribute('download', 'export.zip');
        document.body.appendChild(downloadLink);
        downloadLink.click();

        this.isLoading = false;
      },
      error: (error) => {
        this.alertService.errorObject(error);
        this.isLoading = false;
      },
    });
  }

  private getExportForm(): FormGroup {
    return new FormGroup(
      {
        start_date: new FormControl<string>(null),
        end_date: new FormControl<string>(null),
        study_name: new FormControl<string>(null, Validators.required),
        questionnaires: new FormControl<{ id: number; version: number }[]>({
          value: [],
          disabled: true,
        }),
        probands: new FormControl<string>({ value: null, disabled: true }),
        exports: new FormArray(
          this.exportCheckboxes.map(() => new FormControl(true))
        ),
      },
      [
        this.validateCheckboxes.bind(this),
        this.validateQuestionnaires.bind(this),
        this.validateProbands.bind(this),
      ]
    );
  }

  private async fetchSelectionData(): Promise<void> {
    this.isLoading = true;
    try {
      this.probandsForSelection = this.getProbandsForSelection();

      const { questionnaires } =
        await this.questionnaireService.getQuestionnaires();
      const studyQuestionnaires: StudyQuestionnaire[] = questionnaires
        .map((q) => ({
          id: q.id,
          study_id: q.study_id,
          name: q.name,
          version: q.version,
        }))
        .sort(this.sortStudyQuestionnaire);
      this.questionnairesForSelection =
        this.getQuestionnairesForSelection(studyQuestionnaires);
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  private getProbandsForSelection(): Observable<Proband[]> {
    return combineLatest([
      this.form.get('study_name').valueChanges,
      this.probandFilterCtrl.valueChanges.pipe(startWith('')),
    ]).pipe(
      concatMap(async ([studyName, searchValue]: [string, string]) => {
        return [await this.probandService.getProbands(studyName), searchValue];
      }),
      tap(
        ([probands, _searchValue]: [Proband[], string]) =>
          (this.allProbandsOfSelectedStudy = probands.map(
            (proband) => proband.pseudonym
          ))
      ),
      map(([probands, searchValue]: [Proband[], string]) => {
        return probands.filter((proband) =>
          DialogExportDataComponent.containsSearchValue(
            proband.pseudonym,
            searchValue
          )
        );
      }),
      startWith([])
    );
  }

  private getQuestionnairesForSelection(
    questionnaires: StudyQuestionnaire[]
  ): Observable<StudyQuestionnaire[]> {
    return combineLatest([
      this.form.get('study_name').valueChanges,
      this.questionnaireFilterCtrl.valueChanges.pipe(startWith('')),
    ]).pipe(
      map(([study_id, searchValue]: [string, string]) =>
        questionnaires.filter(
          (questionnaire) =>
            DialogExportDataComponent.containsSearchValue(
              questionnaire.name,
              searchValue
            ) && questionnaire.study_id === study_id
        )
      ),
      startWith([])
    );
  }

  private resetSelectionOnStudyChange(): void {
    this.form.get('study_name').valueChanges.subscribe(() => {
      this.form.get('questionnaires').setValue([]);
      this.form.get('questionnaires').enable();
      this.form.get('probands').setValue([]);
      if (this.isProbandSelectionRequired()) {
        this.form.get('probands').enable();
      }
    });
  }

  private controlProbandSelectionOnExportsChange(): void {
    this.form.get('exports').valueChanges.subscribe((value) => {
      const exports = this.mapSelectedExportValuesToStrings(value);
      if (this.isProbandSelectionRequired(exports)) {
        this.form.get('probands').enable();
      } else if (this.form.get('study_name').value) {
        this.form.get('probands').disable();
      }
    });
  }

  private validateCheckboxes(control: AbstractControl): {
    emptyCheckboxes: boolean;
  } {
    if (this.getExports(control).length === 0) {
      return { emptyCheckboxes: true };
    } else {
      return null;
    }
  }

  private validateQuestionnaires(control: AbstractControl): {
    emptyQuestionnaires: boolean;
  } {
    const exports = this.getExports(control);
    if (
      (!control.get('questionnaires').value ||
        control.get('questionnaires').value.length === 0) &&
      (exports.includes('answers') || exports.includes('codebook'))
    ) {
      return { emptyQuestionnaires: true };
    } else {
      return null;
    }
  }

  private validateProbands(control: AbstractControl): {
    emptyProbands: boolean;
  } {
    if (!this.isProbandSelectionRequired(control)) {
      return null;
    }

    if (control.get('probands')?.value?.length > 0) {
      return null;
    }

    return { emptyProbands: true };
  }

  private getExports(control?: AbstractControl): string[] {
    if (!control) {
      control = this.form;
    }

    return this.mapSelectedExportValuesToStrings(control.get('exports').value);
  }

  private mapSelectedExportValuesToStrings(values: boolean[]): string[] {
    return values
      .map((isChecked, index) =>
        isChecked ? this.exportCheckboxes[index].value : null
      )
      .filter((value) => value !== null);
  }

  private isProbandSelectionRequired(
    exports?: string[] | AbstractControl
  ): boolean {
    let selectedExports: string[];

    if (!exports) {
      selectedExports = this.getExports();
    } else if (exports instanceof AbstractControl) {
      selectedExports = this.getExports(exports);
    } else {
      selectedExports = exports;
    }

    return selectedExports.some(
      (selectedValue) =>
        this.exportCheckboxes.find((entry) => entry.value === selectedValue)
          ?.requiresProbandSelection
    );
  }

  private sortStudyQuestionnaire(
    a: StudyQuestionnaire,
    b: StudyQuestionnaire
  ): number {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    if (nameA < nameB || a.version < b.version) {
      return -1;
    }
    if (nameA > nameB || a.version > b.version) {
      return 1;
    }
    return 0;
  }
}
