/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { AbstractFeedbackStatisticConfigurationComponent } from '../abstract-feedback-statistic-configuration.component';
import { FeedbackStatisticMetaDataComponent } from '../feedback-statistic-meta-data/feedback-statistic-meta-data.component';
import { FeedbackStatisticsService } from '../feedback-statistics.service';
import { SpecificFeedbackStatisticForm } from './feedback-statistic-configuration-form';
import {
  FeedbackStatisticConfigurationDto,
  SpecificFeedbackStatisticConfigurationDto,
} from './feedback-statistic-configuration.model';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { DialogInfoComponent } from '../../../_helpers/dialog-info';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-feedback-statistic-configuration',
  templateUrl: './feedback-statistic-configuration.component.html',
})
export class FeedbackStatisticConfigurationComponent implements AfterViewInit {
  public isLoading = false;
  public studyName: string = this.activatedRoute.snapshot.params.studyName;

  public get isEditMode(): boolean {
    return this.configurationId !== undefined;
  }

  @ViewChild(FeedbackStatisticMetaDataComponent, { static: true })
  public metaDataConfigurationComponent: FeedbackStatisticMetaDataComponent;

  @ViewChild('specificConfigurationComponent')
  public specificConfigurationComponent: AbstractFeedbackStatisticConfigurationComponent<
    SpecificFeedbackStatisticForm,
    SpecificFeedbackStatisticConfigurationDto
  >;

  private configurationId: number =
    this.activatedRoute.snapshot.params.configurationId;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly feedbackStatisticsService: FeedbackStatisticsService,
    private readonly router: Router,
    private readonly matDialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly translate: TranslateService
  ) {}

  public ngAfterViewInit(): void {
    if (this.isEditMode) {
      this.feedbackStatisticsService
        .getFeedbackStatisticConfiguration(this.configurationId, this.studyName)
        .subscribe((configuration) => {
          this.metaDataConfigurationComponent.setConfiguration(configuration);
          this.specificConfigurationComponent.setConfiguration(configuration);
          this.isLoading = false;
        });
    } else {
      setTimeout(() => {
        this.metaDataConfigurationComponent.form.controls.study.setValue(
          this.studyName
        );
        this.isLoading = false;
      });
    }
  }

  public async submit(): Promise<void> {
    if (
      this.metaDataConfigurationComponent.form.invalid ||
      this.specificConfigurationComponent.form.invalid
    ) {
      this.metaDataConfigurationComponent.form.markAllAsTouched();
      this.specificConfigurationComponent.form.markAllAsTouched();
      return;
    }

    const configuration: FeedbackStatisticConfigurationDto = {
      ...this.metaDataConfigurationComponent.getConfiguration(),
      ...this.specificConfigurationComponent.getConfiguration(),
    };

    try {
      if (this.isEditMode) {
        await lastValueFrom(
          this.feedbackStatisticsService.putFeedbackStatisticConfiguration({
            id: this.configurationId,
            ...configuration,
          })
        );
      } else {
        await lastValueFrom(
          this.feedbackStatisticsService.postFeedbackStatisticConfiguration(
            configuration
          )
        );
      }

      this.onSuccessfulSubmit();
    } catch (error) {
      console.log(
        'error at updating/saving feedback statistic configuration: ',
        error
      );

      this.snackBar.open(
        this.translate.instant('FEEDBACK_STATISTICS.SAVING_ERROR'),
        'X',
        {
          panelClass: ['error'],
          duration: 4000,
        }
      );
    }
  }

  public goBack(): void {
    this.router.navigate(['feedback-statistics', 'study', this.studyName]);
  }

  private onSuccessfulSubmit(): void {
    this.matDialog
      .open(DialogInfoComponent, {
        width: '450px',
        data: {
          content: 'FEEDBACK_STATISTICS.SUBMIT_SUCCESS',
        },
      })
      .afterClosed()
      .subscribe(() => this.goBack());
  }
}
