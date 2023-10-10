/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import {
  Questionnaire,
  QuestionnaireListResponse,
} from '../../../psa.app.core/models/questionnaire';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { HttpErrorResponse } from '@angular/common/http';
import { endOfDay, startOfDay } from 'date-fns';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';

export interface DialogSelectForPartialDeletionData {
  probandId: string;
  studyId?: string;
}

export interface DialogSelectForPartialDeletionResult {
  startDate: Date | null;
  endDate: Date | null;
  questionnaires: Questionnaire[];
  labResults: LabResult[];
  userForApprove: string;
  probandId: string;
}

@Component({
  selector: 'app-dialog-select-for-partial-deletion',
  templateUrl: 'dialog-select-for-partial-deletion.component.html',
  styleUrls: ['dialog-select-for-partial-deletion.component.scss'],
})
export class DialogSelectForPartialDeletionComponent implements OnInit {
  public currentDate = new Date();
  public isLoading: boolean = false;
  public userForApproveFC = new FormControl(null, [
    Validators.required,
    Validators.email,
  ]);
  public readonly form: FormGroup = new FormGroup(
    {
      startDate: new FormControl(null),
      endDate: new FormControl(null),
      questionnaires: new FormControl([]),
      labResults: new FormControl([]),
      userForApprove: this.userForApproveFC,
    },
    DialogSelectForPartialDeletionComponent.atLeastOneRequiredValidator(
      'questionnaires',
      'labResults'
    )
  );
  public readonly labResultsFilterCtrl: FormControl = new FormControl();
  public readonly questionnairesFilterCtrl: FormControl = new FormControl();
  public readonly researcherFilterCtrl: FormControl = new FormControl();
  public filteredLabResults: LabResult[] = [];
  public filteredQuestionnaires: Questionnaire[] = [];
  public filteredResearchers: string[] = [];
  private labResults: LabResult[] = [];
  private questionnaires: Questionnaire[] = [];
  private researchers: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<
      DialogSelectForPartialDeletionComponent,
      DialogSelectForPartialDeletionResult
    >,
    private sampleTrackingService: SampleTrackingService,
    private userService: UserService,
    private alertService: AlertService,
    @Inject(MAT_DIALOG_DATA) public data: DialogSelectForPartialDeletionData,
    private questionnaireService: QuestionnaireService
  ) {
    this.isLoading = true;

    // listen for search field value changes
    this.labResultsFilterCtrl.valueChanges.subscribe(() => {
      this.filterLabResults();
    });

    this.questionnairesFilterCtrl.valueChanges.subscribe(() => {
      this.filterQuestionnaires();
    });

    this.researcherFilterCtrl.valueChanges.subscribe(() => {
      this.filterResearchers();
    });
  }

  private static atLeastOneRequiredValidator(
    ...controlNames: string[]
  ): ValidatorFn {
    return (control: AbstractControl): { oneRequired: boolean } | null => {
      const atLeastOneHasAValue = controlNames.some((controlName) => {
        const controlValueToCheck = control.get(controlName).value;
        return (
          controlValueToCheck &&
          (!Array.isArray(controlValueToCheck) ||
            controlValueToCheck.length > 0)
        );
      });
      return atLeastOneHasAValue ? null : { oneRequired: true };
    };
  }

  public async ngOnInit(): Promise<void> {
    const getLabResultPromise = this.sampleTrackingService
      .getAllLabResultsForUser(this.data.probandId)
      .then((result: LabResult[]) => {
        this.labResults = result.filter(
          (labResult) => labResult.status === 'analyzed'
        );
        this.filteredLabResults = this.labResults;
      })
      .catch((err: HttpErrorResponse) => {
        this.alertService.errorObject(err);
      });

    const getQuestionnairesPromise = this.questionnaireService
      .getQuestionnaires()
      .then((result: QuestionnaireListResponse) => {
        this.questionnaires = result.questionnaires
          ? result.questionnaires
          : [];
        if (this.data.studyId) {
          this.questionnaires = this.questionnaires.filter(
            (q) => q.study_id === this.data.studyId
          );
        }
        this.filteredQuestionnaires = this.questionnaires;
      })
      .catch((err: HttpErrorResponse) => {
        this.alertService.errorObject(err);
      });

    const getUsersWithSameRolePromise = this.userService
      .getProfessionalAccounts({
        studyName: this.data.studyId,
        onlyMailAddresses: true,
        filterSelf: true,
      })
      .then((accounts) => {
        this.researchers = accounts.map((user) => user.username);
        this.filteredResearchers = this.researchers;
      })
      .catch((err: HttpErrorResponse) => {
        this.alertService.errorObject(err);
      });

    await Promise.all([
      getLabResultPromise,
      getUsersWithSameRolePromise,
      getQuestionnairesPromise,
    ]).finally(() => {
      this.isLoading = false;
    });
  }

  onDateRangeChanged(newDate: Date): void {
    const start = this.form.get('startDate').value
      ? startOfDay(this.form.get('startDate').value)
      : new Date(0);
    const end = this.form.get('endDate').value
      ? endOfDay(this.form.get('endDate').value)
      : new Date();
    if (end && start && end.getTime() < start.getTime()) {
      this.form.get('startDate').setValue(newDate);
      this.form.get('endDate').setValue(newDate);
    }
    // filter the lab results
    this.filteredLabResults = this.labResults.filter(
      (labresult) =>
        new Date(labresult.date_of_sampling) >= start &&
        new Date(labresult.date_of_sampling) <= end
    );
  }

  public submit(): void {
    this.form.markAllAsTouched();
    if (!this.form.valid) {
      return;
    }
    const startDate = this.form.get('startDate').value;
    const endDate = this.form.get('endDate').value;
    const selection: DialogSelectForPartialDeletionResult = {
      startDate: startDate ? startOfDay(startDate) : null,
      endDate: endDate ? endOfDay(endDate) : null,
      questionnaires: this.form
        .get('questionnaires')
        .value.filter((value) => value !== 'allQuestionnairesCheckbox'),
      labResults: this.form
        .get('labResults')
        .value.filter((value) => value !== 'allLabResultsCheckbox'),
      userForApprove: this.form.get('userForApprove').value,
      probandId: this.data.probandId,
    };
    this.dialogRef.close(selection);
  }

  onSelectAllQuestionnairesClicked(): void {
    const questionnairesNameArray = [];
    if (
      this.form.get('questionnaires').value[0] ===
        'allQuestionnairesCheckbox' &&
      this.form.get('questionnaires').value.length !==
        this.filteredQuestionnaires.length + 1
    ) {
      questionnairesNameArray.push('allQuestionnairesCheckbox');
      questionnairesNameArray.push(...this.filteredQuestionnaires);
    }
    this.form.get('questionnaires').setValue(questionnairesNameArray);
  }

  onSelectAllLabResultsClicked(): void {
    const labResultsNameArray = [];
    if (
      this.form.get('labResults').value[0] === 'allLabResultsCheckbox' &&
      this.form.get('labResults').value.length !==
        this.filteredLabResults.length + 1
    ) {
      labResultsNameArray.push('allLabResultsCheckbox');
      for (const labResult of this.filteredLabResults) {
        labResultsNameArray.push(labResult);
      }
    }
    this.form.get('labResults').setValue(labResultsNameArray);
  }

  private filterQuestionnaires(): void {
    // get the search keyword
    const search = this.questionnairesFilterCtrl.value.toLowerCase();
    if (!search) {
      this.filteredQuestionnaires = this.questionnaires;
      return;
    }
    // filter the questionnaire instances
    this.filteredQuestionnaires = this.questionnaires.filter(
      (questionnaire) => questionnaire.name.toLowerCase().indexOf(search) > -1
    );
  }

  private filterLabResults(): void {
    // get the search keyword
    const search = this.labResultsFilterCtrl.value.toLowerCase();
    if (!search) {
      this.filteredLabResults = this.labResults;
      return;
    }
    // filter the lab results
    this.filteredLabResults = this.labResults.filter(
      (labresult) => labresult.id.toLowerCase().indexOf(search) > -1
    );
  }

  private filterResearchers(): void {
    // get the search keyword
    const search = this.researcherFilterCtrl.value.toLowerCase();
    if (!search) {
      this.filteredResearchers = this.researchers;
      return;
    }
    // filter the researchers
    this.filteredResearchers = this.researchers.filter(
      (username) => username.toLowerCase().indexOf(search) > -1
    );
  }
}
