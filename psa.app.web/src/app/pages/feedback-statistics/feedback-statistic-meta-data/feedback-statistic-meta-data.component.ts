/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit } from '@angular/core';
import {
  FeedbackStatisticConfigurationMetaDataForm,
  FeedbackStatisticMetaDataFormService,
  feedbackStatisticTitleMaxLength,
} from './feedback-statistic-meta-data-form.service';
import { AbstractFeedbackStatisticConfigurationComponent } from '../abstract-feedback-statistic-configuration.component';
import { FeedbackStatisticConfigurationMetaDataDto } from '../feedback-statistic-configuration/feedback-statistic-configuration.model';

@Component({
  selector: 'app-feedback-statistic-meta-data',
  templateUrl: './feedback-statistic-meta-data.component.html',
  styleUrls: ['./feedback-statistic-meta-data.component.scss'],
})
export class FeedbackStatisticMetaDataComponent
  extends AbstractFeedbackStatisticConfigurationComponent<
    FeedbackStatisticConfigurationMetaDataForm,
    FeedbackStatisticConfigurationMetaDataDto
  >
  implements OnInit
{
  @Input()
  study: string;

  public readonly form = this.formService.getForm();

  public readonly feedbackStatisticTitleMaxLength =
    feedbackStatisticTitleMaxLength;

  public readonly visibilityOptions = [
    { value: 'hidden', viewValue: 'FEEDBACK_STATISTICS.HIDDEN' },
    { value: 'testprobands', viewValue: 'FEEDBACK_STATISTICS.TESTPROBANDS' },
    { value: 'allaudiences', viewValue: 'FEEDBACK_STATISTICS.ALLAUDIENCES' },
  ];

  constructor(
    private readonly formService: FeedbackStatisticMetaDataFormService
  ) {
    super();
  }
  public ngOnInit() {
    this.form.controls.study.setValue(this.study);
  }

  public getConfiguration() {
    return this.formService.getDto(this.form);
  }

  public setConfiguration(
    configuration: FeedbackStatisticConfigurationMetaDataDto
  ) {
    this.form.patchValue(this.formService.getForm(configuration).value);
  }
}
