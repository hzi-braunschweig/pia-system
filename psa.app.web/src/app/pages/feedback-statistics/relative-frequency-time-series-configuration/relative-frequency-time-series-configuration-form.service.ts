/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  FeedbackStatisticTimeSeriesDto,
  RelativeFrequencyTimeSeriesConfigurationDto,
} from '../feedback-statistic-configuration/feedback-statistic-configuration.model';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { endOfDay } from 'date-fns';

export type QuestionnaireIdAndVersion = Pick<Questionnaire, 'id' | 'version'>;

export type RelativeFrequencyTimeSeriesConfigurationForm = ReturnType<
  RelativeFrequencyTimeSeriesConfigurationFormService['getForm']
>;

export type TimeSeriesForm = ReturnType<
  RelativeFrequencyTimeSeriesConfigurationFormService['getTimeSeriesForm']
>;

export const timeSeriesLabelMaxLength = 80;

@Injectable({
  providedIn: 'root',
})
export class RelativeFrequencyTimeSeriesConfigurationFormService {
  public getForm(
    configuration: RelativeFrequencyTimeSeriesConfigurationDto = this.getEmptyConfiguration()
  ) {
    return new FormGroup({
      comparativeValues: new FormGroup({
        questionnaire: new FormControl(
          configuration.comparativeValues.questionnaire,
          [Validators.required]
        ),
        answerOptionValueCodes: new FormGroup({
          id: new FormControl(
            configuration.comparativeValues.answerOptionValueCodes.id,
            [Validators.required]
          ),
          variableName: new FormControl(
            configuration.comparativeValues.answerOptionValueCodes.variableName
          ),
          valueCodes: new FormControl(
            configuration.comparativeValues.answerOptionValueCodes.valueCodes,
            [Validators.required, Validators.minLength(1)]
          ),
        }),
      }),
      timeSeries: new FormArray<TimeSeriesForm>(
        configuration.timeSeries.length
          ? configuration.timeSeries.map((entry) =>
              this.getTimeSeriesForm(entry)
            )
          : []
      ),
      intervalShift: new FormGroup({
        amount: new FormControl(configuration.intervalShift.amount, [
          Validators.required,
          Validators.pattern('^-?[0-9]*$'),
        ]),
        unit: new FormControl(configuration.intervalShift.unit, [
          Validators.required,
        ]),
      }),
      timeRange: new FormGroup({
        startDate: new FormControl(
          configuration.timeRange.startDate
            ? new Date(configuration.timeRange.startDate)
            : null,
          [Validators.required]
        ),
        endDate: new FormControl(
          configuration.timeRange.endDate
            ? new Date(configuration.timeRange.endDate)
            : null,
          [Validators.required]
        ),
      }),
    });
  }

  public getDto(form: RelativeFrequencyTimeSeriesConfigurationForm) {
    return {
      comparativeValues: {
        questionnaire: {
          id: form.controls.comparativeValues.controls.questionnaire.value.id,
          version:
            form.controls.comparativeValues.controls.questionnaire.value
              .version,
        },
        answerOptionValueCodes: {
          id: form.controls.comparativeValues.controls.answerOptionValueCodes
            .controls.id.value,
          variableName:
            form.controls.comparativeValues.controls.answerOptionValueCodes
              .controls.variableName.value,
          valueCodes:
            form.controls.comparativeValues.controls.answerOptionValueCodes
              .controls.valueCodes.value,
        },
      },
      timeSeries: form.controls.timeSeries.getRawValue().map((timeSeries) => ({
        id: timeSeries.id,
        color: timeSeries.color,
        label: timeSeries.label,
        questionnaire: {
          id: timeSeries.questionnaire.id,
          version: timeSeries.questionnaire.version,
        },
        answerOptionValueCodes: {
          id: timeSeries.answerOptionValueCodes.id,
          variableName: timeSeries.answerOptionValueCodes.variableName,
          valueCodes: timeSeries.answerOptionValueCodes.valueCodes,
        },
      })),
      intervalShift: {
        amount: form.controls.intervalShift.controls.amount.value,
        unit: form.controls.intervalShift.controls.unit.value,
      },
      timeRange: {
        startDate:
          form.controls.timeRange.controls.startDate.value.toISOString(),
        endDate: form.controls.timeRange.controls.endDate.value
          ? endOfDay(
              form.controls.timeRange.controls.endDate.value
            ).toISOString()
          : null,
      },
    };
  }

  public getTimeSeriesForm(
    timeSeries: FeedbackStatisticTimeSeriesDto = this.getEmptyTimeSeries()
  ) {
    return new FormGroup({
      id: new FormControl({ value: timeSeries.id, disabled: true }),
      color: new FormControl(timeSeries.color, [Validators.required]),
      label: new FormControl(timeSeries.label, [
        Validators.required,
        Validators.maxLength(timeSeriesLabelMaxLength),
      ]),
      questionnaire: new FormControl({
        value: timeSeries.questionnaire,
        disabled: true,
      }),
      answerOptionValueCodes: new FormGroup({
        id: new FormControl(timeSeries.answerOptionValueCodes.id, [
          Validators.required,
        ]),
        variableName: new FormControl(
          timeSeries.answerOptionValueCodes.variableName
        ),
        valueCodes: new FormControl(
          timeSeries.answerOptionValueCodes.valueCodes,
          [Validators.required, Validators.minLength(1)]
        ),
      }),
    });
  }

  public isSameQuestionnaireValue(
    q1: QuestionnaireIdAndVersion,
    q2: QuestionnaireIdAndVersion
  ): boolean {
    return q1?.id === q2?.id && q1?.version === q2?.version;
  }

  private getEmptyConfiguration(): RelativeFrequencyTimeSeriesConfigurationDto {
    return {
      comparativeValues: {
        questionnaire: null,
        answerOptionValueCodes: {
          id: null,
          variableName: null,
          valueCodes: [],
        },
      },
      timeSeries: [this.getEmptyTimeSeries()],
      intervalShift: {
        amount: null,
        unit: null,
      },
      timeRange: {
        startDate: null,
        endDate: null,
      },
    };
  }

  private getEmptyTimeSeries(): FeedbackStatisticTimeSeriesDto {
    return {
      id: undefined,
      color: null,
      label: null,
      questionnaire: null,
      answerOptionValueCodes: {
        id: null,
        variableName: null,
        valueCodes: [],
      },
    };
  }
}
