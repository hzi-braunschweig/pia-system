/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatOption, MatSelect } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { AlertService } from 'src/app/_services/alert.service';
import { LoadingSpinnerModule } from 'src/app/features/loading-spinner/loading-spinner.module';
import {
  PublishMode,
  QuestionnaireFile,
} from 'src/app/psa.app.core/models/questionnaireImport';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Study } from '../../../../psa.app.core/models/study';
import { UserService } from '../../../../psa.app.core/providers/user-service/user.service';

@Component({
  selector: 'app-dialog-import-questionnaire-component',
  imports: [
    LoadingSpinnerModule,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatIcon,
    MatLabel,
    MatOption,
    MatRadioButton,
    MatRadioGroup,
    MatSelect,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './dialog-import-questionnaire-component.component.html',
})
export class DialogImportQuestionnaireComponentComponent implements OnInit {
  @ViewChild('importFileInput')
  private readonly importFileInput: ElementRef<HTMLInputElement>;

  public isLoading = false;

  public form = new FormGroup({
    study: new FormControl<string>(undefined, Validators.required),
    publishMode: new FormControl<PublishMode>(PublishMode.ADAPT),
    questionnaireFile: new FormControl<QuestionnaireFile>(
      undefined,
      Validators.required
    ),
  });

  public studies: Study[];

  public importState: 'idle' | 'success' | 'error' = 'idle';

  public constructor(
    private readonly userService: UserService,
    private readonly questionnaireService: QuestionnaireService,
    private readonly alertService: AlertService
  ) {}

  public ngOnInit(): void {
    this.isLoading = true;
    this.userService
      .getStudies()
      .then((studies) => {
        this.studies = studies;
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          this.alertService.errorObject(err);
        }
        console.error(err);
      })
      .finally(() => {
        this.isLoading = false;
      });
  }

  public async addFile(): Promise<void> {
    this.isLoading = true;
    const fileLoadings: Promise<void>[] = [];
    for (const file of this.importFileInput.nativeElement.files) {
      const { promise, resolve: loadingEnded } = Promise.withResolvers<void>();
      fileLoadings.push(promise);
      const reader = new FileReader();
      reader.onload = (e): void => {
        if (typeof e.target.result !== 'string') {
          this.alertService.errorObject(Error('Wrong file format.'));
          return;
        }
        this.form.controls.questionnaireFile.setValue({
          name: file.name,
          content: e.target.result,
        });
      };
      reader.onloadend = (): void => loadingEnded();
      reader.onabort = (): void => loadingEnded();
      reader.onerror = (): void => {
        this.alertService.errorObject(Error('File could not be read.'));
        loadingEnded();
      };
      reader.readAsText(file);
    }

    await Promise.all(fileLoadings).finally(() => {
      this.isLoading = false;
    });
  }

  public async submit(): Promise<void> {
    this.importState = 'idle';
    if (!this.form.valid) return;
    try {
      this.isLoading = true;
      const formValue = this.form.value;
      const response = await this.questionnaireService.importQuestionnaire(
        formValue.study,
        formValue.publishMode,
        [formValue.questionnaireFile]
      );
      if (response.errors?.length) {
        this.form.controls.questionnaireFile.setErrors({
          [response.errors[0].errorCode]: response.errors[0].message,
        });
        this.importState = 'error';
      } else {
        this.importState = 'success';
      }
    } catch (err) {
      this.alertService.errorObject(err);
    } finally {
      this.isLoading = false;
    }
  }
}
