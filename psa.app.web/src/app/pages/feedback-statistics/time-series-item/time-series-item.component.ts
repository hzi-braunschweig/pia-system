/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  RelativeFrequencyTimeSeriesConfigurationFormService,
  timeSeriesLabelMaxLength,
} from '../relative-frequency-time-series-configuration/relative-frequency-time-series-configuration-form.service';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { AnswerOption } from '../../../psa.app.core/models/answerOption';
import {
  AnswerOptionValue,
  RelativeFrequencyTimeSeriesConfigurationComponent,
} from '../relative-frequency-time-series-configuration/relative-frequency-time-series-configuration.component';
import { AnswerType } from '../../../psa.app.core/models/answerType';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-time-series-item',
  templateUrl: './time-series-item.component.html',
  styleUrls: ['./time-series-item.component.scss'],
})
export class TimeSeriesItemComponent implements OnChanges {
  @Input()
  public index: number;

  @Input()
  public form: ReturnType<
    RelativeFrequencyTimeSeriesConfigurationFormService['getTimeSeriesForm']
  >;

  @Input()
  public selectedQuestionnaire: Questionnaire;

  @Input()
  public selectableColors: string[] = [];

  @Output()
  public remove: EventEmitter<void> = new EventEmitter<void>();

  public availableColors =
    RelativeFrequencyTimeSeriesConfigurationComponent.availableColors;

  public readonly answerOptionFilterCtrl = new FormControl();

  public readonly timeSeriesLabelMaxLength = timeSeriesLabelMaxLength;

  public selectableAnswerOptions: AnswerOption[] = [];

  public selectableAnswerOptionValues: AnswerOptionValue[] = [];

  private answerOptionSelectedSubscription: Subscription;

  private selectableAnswerOptionsSubscription: Subscription;

  constructor(
    public readonly formService: RelativeFrequencyTimeSeriesConfigurationFormService
  ) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ('selectedQuestionnaire' in changes) {
      this.setSelectableAnswerOptions();
    }

    if ('form' in changes) {
      this.answerOptionSelectedSubscription?.unsubscribe();
      this.answerOptionSelectedSubscription =
        this.form.controls.answerOptionValueCodes.controls.id.valueChanges.subscribe(
          (answerOptionId) => this.onAnswerOptionSelected(answerOptionId)
        );
      if (this.form.controls.answerOptionValueCodes.controls.id.value) {
        this.onAnswerOptionSelected(
          this.form.controls.answerOptionValueCodes.controls.id.value,
          false
        );
      }
    }
  }

  public selectableAndSelectedColors(): string[] {
    return this.availableColors.filter(
      (color) =>
        this.selectableColors.includes(color) ||
        color === this.form.controls.color.value
    );
  }

  private onAnswerOptionSelected(answerOptionId: number, reset = true): void {
    const answerOption = this.selectableAnswerOptions.find(
      (answerOption) => answerOption.id === answerOptionId
    );
    if (answerOption) {
      this.form.controls.answerOptionValueCodes.controls.variableName.setValue(
        answerOption.variable_name
      );
    }
    this.setSelectableAnswerOptionValues(answerOption, reset);
  }

  private setSelectableAnswerOptions(): void {
    this.selectableAnswerOptionsSubscription?.unsubscribe();
    this.selectableAnswerOptionsSubscription =
      this.answerOptionFilterCtrl.valueChanges
        .pipe(
          startWith(null),
          map((answerOptionFilter: string | null) => {
            return this.selectedQuestionnaire.questions
              .flatMap((question) =>
                question.answer_options.map((answerOption) =>
                  answerOption.text
                    ? answerOption
                    : { ...answerOption, text: question.text }
                )
              )
              .filter(
                (answerOptions) =>
                  answerOptions.answer_type_id === AnswerType.SingleSelect ||
                  answerOptions.answer_type_id === AnswerType.MultiSelect
              )
              .filter((answerOption) =>
                answerOptionFilter
                  ? answerOption.text
                      .toLowerCase()
                      .concat(answerOption.variable_name?.toLowerCase() ?? '')
                      .includes(answerOptionFilter.toLowerCase())
                  : true
              );
          })
        )
        .subscribe(
          (answerOptions) => (this.selectableAnswerOptions = answerOptions)
        );
  }

  private setSelectableAnswerOptionValues(
    answerOption: AnswerOption,
    reset: boolean
  ): void {
    if (reset) {
      this.form.controls.answerOptionValueCodes.controls.valueCodes.reset();
    }
    if (answerOption) {
      this.selectableAnswerOptionValues = answerOption.values_code.map(
        (valueCode, index) => ({
          text: answerOption.values[index],
          code: valueCode,
        })
      );
    }
  }
}
