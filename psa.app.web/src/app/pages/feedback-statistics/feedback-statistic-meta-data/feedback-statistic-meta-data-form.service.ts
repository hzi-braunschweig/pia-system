/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { FeedbackStatisticConfigurationMetaDataDto } from '../feedback-statistic-configuration/feedback-statistic-configuration.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';

export type FeedbackStatisticConfigurationMetaDataForm = ReturnType<
  FeedbackStatisticMetaDataFormService['getForm']
>;

export const feedbackStatisticTitleMaxLength = 80;

@Injectable({
  providedIn: 'root',
})
export class FeedbackStatisticMetaDataFormService {
  public getForm(
    metaData: FeedbackStatisticConfigurationMetaDataDto = this.getEmptyMetaData()
  ) {
    return new FormGroup({
      // meta data
      study: new FormControl({
        value: metaData.study,
        disabled: true,
      }),
      title: new FormControl(metaData.title, [
        Validators.required,
        Validators.maxLength(feedbackStatisticTitleMaxLength),
      ]),
      visibility: new FormControl(metaData.visibility, [Validators.required]),
      description: new FormControl(metaData.description),
      type: new FormControl<'relative_frequency_time_series'>({
        value: metaData.type,
        disabled: true,
      }),
    });
  }

  public getDto(
    form: FeedbackStatisticConfigurationMetaDataForm
  ): FeedbackStatisticConfigurationMetaDataDto {
    return {
      study: form.controls.study.value,
      visibility: form.controls.visibility.value,
      title: form.controls.title.value,
      description: form.controls.description.value,
      type: form.controls.type.value,
    };
  }

  private getEmptyMetaData(): FeedbackStatisticConfigurationMetaDataDto {
    return {
      study: null,
      visibility: null,
      title: null,
      description: '',
      type: 'relative_frequency_time_series',
    };
  }
}
