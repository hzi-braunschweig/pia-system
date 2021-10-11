/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../_services/alert.service';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import {
  DialogPopUpComponent,
  DialogPopUpData,
} from 'src/app/_helpers/dialog-pop-up';
import { Observable } from 'rxjs';
import { CreateIDSProbandRequest } from '../../psa.app.core/models/proband';
import { map, shareReplay, startWith } from 'rxjs/operators';

@Component({
  selector: 'dialog-new-ids',
  styleUrls: ['new-ids-dialog.scss'],
  templateUrl: 'new-ids-dialog.html',
})
export class DialogNewIdsComponent implements OnInit {
  public form: FormGroup;
  public isLoading: boolean = false;
  public studiesFilterCtrl: FormControl = new FormControl('');
  public filteredStudies: Observable<string[]>;

  public constructor(
    private dialogRef: MatDialogRef<DialogNewIdsComponent>,
    private authService: AuthService,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private dialog: MatDialog
  ) {
    this.form = new FormGroup({
      ids: new FormControl('', Validators.required),
      studyName: new FormControl(null, Validators.required),
    });
  }

  public async ngOnInit(): Promise<void> {
    this.isLoading = true;
    let studies: string[] = [];
    try {
      const result = await this.questionnaireService.getStudies();
      // Hard coded filtering of ZIFCO-Studie
      studies = result.studies
        .map((study) => study.name)
        .filter((name) => name !== 'ZIFCO-Studie');
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.filteredStudies = this.createStudiesFilterObservable(studies);
    this.isLoading = false;
  }

  private createStudiesFilterObservable(
    studies: string[]
  ): Observable<string[]> {
    return this.studiesFilterCtrl.valueChanges.pipe(
      startWith(this.studiesFilterCtrl.value as string),
      map((filterValue) => filterValue.toLowerCase()),
      map((filterValue) => {
        if (!filterValue) {
          return studies;
        } else {
          return studies.filter((study) =>
            study.toLowerCase().includes(filterValue)
          );
        }
      }),
      shareReplay(1)
    );
  }

  public async submit(): Promise<void> {
    try {
      const payload: CreateIDSProbandRequest = {
        ids: this.form.get('ids').value,
      };
      await this.authService.postIDS(payload, this.form.get('studyName').value);
      this.dialogRef.close(payload.ids);
    } catch (err) {
      this.dialog.open<DialogPopUpComponent, DialogPopUpData>(
        DialogPopUpComponent,
        {
          width: '500px',
          data: {
            content: 'DIALOG.CREATE_IDS_ERROR',
            isSuccess: false,
          },
        }
      );
    }
  }
}
