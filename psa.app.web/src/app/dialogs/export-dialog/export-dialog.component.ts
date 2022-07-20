/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  AbstractControl,
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

    const exportRequestData = this.form.value;

    if (this.form.get('probands').value === 'allProbandsCheckbox') {
      exportRequestData.probands = this.allProbandsOfSelectedStudy;
    } else {
      exportRequestData.probands = [this.form.get('probands').value];
    }

    const responseStream = this.questionnaireService.getExportData(
      this.form.value
    );
    this.saveExportFile(responseStream);
  }

  saveExportFile(responseStream: Observable<HttpEvent<Blob>>): void {
    responseStream.subscribe(async (response: HttpResponse<Blob>) => {
      const downloadLink = document.createElement('a');
      downloadLink.href = window.URL.createObjectURL(response.body);
      downloadLink.setAttribute('download', 'export.zip');
      document.body.appendChild(downloadLink);
      downloadLink.click();

      this.isLoading = false;
    });
  }

  private getExportForm(): FormGroup {
    return new FormGroup(
      {
        start_date: new FormControl(null),
        end_date: new FormControl(null),
        study_name: new FormControl(null, Validators.required),
        questionnaires: new FormControl({ value: [], disabled: true }),
        probands: new FormControl(
          { value: null, disabled: true },
          Validators.required
        ),
        exportAnswers: new FormControl(true, Validators.required),
        exportLabResults: new FormControl(true, Validators.required),
        exportSamples: new FormControl(true, Validators.required),
        exportSettings: new FormControl(true, Validators.required),
      },
      [this.validateCheckboxes, this.validateQuestionnaires]
    );
  }

  private async fetchSelectionData(): Promise<void> {
    this.isLoading = true;
    try {
      this.probandsForSelection = this.getProbandsForSelection();

      const { questionnaires } =
        await this.questionnaireService.getQuestionnaires();
      const studyQuestionnaires: StudyQuestionnaire[] = questionnaires.map(
        (q) => ({ id: q.id, study_id: q.study_id, name: q.name })
      );
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
      this.form.get('probands').enable();
    });
  }

  private validateCheckboxes(control: AbstractControl): {
    emptyCheckboxes: boolean;
  } {
    if (
      (!control.get('exportAnswers') || !control.get('exportAnswers').value) &&
      (!control.get('exportLabResults') ||
        !control.get('exportLabResults').value) &&
      (!control.get('exportSettings') ||
        !control.get('exportSettings').value) &&
      (!control.get('exportSamples') || !control.get('exportSamples').value)
    ) {
      return { emptyCheckboxes: true };
    } else {
      return null;
    }
  }

  private validateQuestionnaires(control: AbstractControl): {
    emptyQuestionnaires: boolean;
  } {
    if (
      (!control.get('questionnaires').value ||
        control.get('questionnaires').value.length === 0) &&
      control.get('exportAnswers').value
    ) {
      return { emptyQuestionnaires: true };
    } else {
      return null;
    }
  }
}
