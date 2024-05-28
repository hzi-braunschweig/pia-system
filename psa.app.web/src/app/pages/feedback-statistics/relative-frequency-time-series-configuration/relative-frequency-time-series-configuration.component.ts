/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import {
  RelativeFrequencyTimeSeriesConfigurationForm,
  RelativeFrequencyTimeSeriesConfigurationFormService,
} from './relative-frequency-time-series-configuration-form.service';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { AnswerOption } from '../../../psa.app.core/models/answerOption';
import { combineLatestWith, Observable, tap } from 'rxjs';
import { filter, map, shareReplay, startWith } from 'rxjs/operators';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import {
  APP_DATE_FORMATS_SHORT,
  AppDateAdapter,
} from '../../../_helpers/date-adapter';
import { AbstractFeedbackStatisticConfigurationComponent } from '../abstract-feedback-statistic-configuration.component';
import {
  FeedbackStatisticTimeSeriesDto,
  RelativeFrequencyTimeSeriesConfigurationDto,
} from '../feedback-statistic-configuration/feedback-statistic-configuration.model';
import { FormControl } from '@angular/forms';
import { fromPromise } from 'rxjs/internal/observable/innerFrom';
import { AnswerType } from '../../../psa.app.core/models/answerType';
import { addDays } from 'date-fns';

export interface AnswerOptionValue {
  text: string;
  code: number;
}

@Component({
  selector: 'app-relative-frequency-time-series-configuration',
  templateUrl: './relative-frequency-time-series-configuration.component.html',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de' },
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: APP_DATE_FORMATS_SHORT,
    },
  ],
})
export class RelativeFrequencyTimeSeriesConfigurationComponent extends AbstractFeedbackStatisticConfigurationComponent<
  RelativeFrequencyTimeSeriesConfigurationForm,
  RelativeFrequencyTimeSeriesConfigurationDto
> {
  public static readonly availableColors = [
    '#668F31',
    '#8FB744',
    '#ADCF67',
    '#CCE697',
    '#2E90C1',
    '#3AA9E0',
    '#84C7E8',
    '#A9DAF3',
  ];

  private static readonly supportedCycleUnits = [
    'hour',
    'day',
    'week',
    'month',
  ];

  public readonly selectableIntervalShiftUnits = [
    {
      value: 'hour',
      viewValue: 'FEEDBACK_STATISTICS.INTERVAL_SHIFT_UNIT_HOUR',
    },
    { value: 'day', viewValue: 'FEEDBACK_STATISTICS.INTERVAL_SHIFT_UNIT_DAY' },
    {
      value: 'week',
      viewValue: 'FEEDBACK_STATISTICS.INTERVAL_SHIFT_UNIT_WEEK',
    },
    {
      value: 'month',
      viewValue: 'FEEDBACK_STATISTICS.INTERVAL_SHIFT_UNIT_MONTH',
    },
  ];

  @Input()
  public study: string;

  public readonly form = this.formService.getForm();

  public readonly maxTimeSeriesCount = 8;

  public readonly questionnaireFilterCtrl = new FormControl();

  public readonly answerOptionFilterCtrl = new FormControl();

  public readonly isEndDateDisabledCtrl = new FormControl(true);

  public readonly allQuestionnaires$: Observable<Questionnaire[]> =
    this.getCyclicQuestionnaires();

  public readonly selectableQuestionnaires$: Observable<Questionnaire[]> =
    this.getSelectableQuestionnaires();

  public readonly selectedQuestionnaire$: Observable<Questionnaire> =
    this.getSelectedQuestionnaire();

  public readonly selectableAnswerOptions$: Observable<AnswerOption[]> =
    this.getSelectableAnswerOptions();

  public readonly selectedAnswerOption$: Observable<AnswerOption> =
    this.getSelectedAnswerOption();

  public readonly selectableAnswerOptionValues$: Observable<
    AnswerOptionValue[]
  > = this.getSelectableAnswerOptionValues();

  public readonly selectableColors$: Observable<string[]> =
    this.getSelectableColors();

  constructor(
    public readonly formService: RelativeFrequencyTimeSeriesConfigurationFormService,
    private readonly questionnaireService: QuestionnaireService
  ) {
    super();

    this.isEndDateDisabledCtrl.valueChanges
      .pipe(startWith(this.isEndDateDisabledCtrl.value))
      .subscribe((isDisabled) => {
        if (isDisabled) {
          this.form.controls.timeRange.controls.endDate.setValue(null);
          this.form.controls.timeRange.controls.endDate.disable();
        } else {
          this.form.controls.timeRange.controls.endDate.enable();
        }
      });
  }

  public getConfiguration(): RelativeFrequencyTimeSeriesConfigurationDto {
    return this.formService.getDto(this.form);
  }

  public setConfiguration(
    configuration: RelativeFrequencyTimeSeriesConfigurationDto
  ) {
    this.form.patchValue(this.formService.getForm(configuration).value);
    this.selectedQuestionnaire$.pipe(filter((q) => !!q)).subscribe((q) => {
      this.form.controls.comparativeValues.controls.answerOptionValueCodes.controls.id.setValue(
        configuration.comparativeValues.answerOptionValueCodes.id
      );
    });
    this.selectedAnswerOption$.pipe(filter((a) => !!a)).subscribe((a) => {
      this.form.controls.comparativeValues.controls.answerOptionValueCodes.controls.valueCodes.setValue(
        configuration.comparativeValues.answerOptionValueCodes.valueCodes
      );
      this.form.controls.timeSeries.clear();
      configuration.timeSeries.forEach((timeSeries) => {
        this.addTimeSeries(timeSeries);
      });
    });
    this.isEndDateDisabledCtrl.setValue(
      configuration.timeRange.endDate === null
    );
  }

  public addTimeSeries(
    existingtimeSeries?: FeedbackStatisticTimeSeriesDto
  ): void {
    const form = this.formService.getTimeSeriesForm(existingtimeSeries);
    form.controls.questionnaire.setValue(
      this.form.controls.comparativeValues.controls.questionnaire.value
    );
    this.form.controls.timeSeries.push(form);
  }

  public removeTimeSeries(index: number): void {
    this.form.controls.timeSeries.removeAt(index);

    if (this.form.controls.timeSeries.length === 0) {
      this.addTimeSeries();
    }
  }

  public resetTimeSeries(): void {
    this.form.controls.timeSeries.clear();
    this.addTimeSeries();
  }

  private getCyclicQuestionnaires(): Observable<Questionnaire[]> {
    return fromPromise(this.questionnaireService.getQuestionnaires()).pipe(
      startWith({ questionnaires: [] }),
      map((response) => response.questionnaires),
      map((questionnaires) =>
        questionnaires.filter((questionnaire) =>
          RelativeFrequencyTimeSeriesConfigurationComponent.supportedCycleUnits.includes(
            questionnaire.cycle_unit
          )
        )
      )
    );
  }

  private getSelectableQuestionnaires(): Observable<Questionnaire[]> {
    return this.questionnaireFilterCtrl.valueChanges.pipe(
      startWith(null),
      combineLatestWith(this.allQuestionnaires$),
      map(([filter, allQuestionnaires]) => {
        return allQuestionnaires
          .filter((questionnaire) => questionnaire.study_id === this.study)
          .filter((questionnaire) => {
            return filter
              ? questionnaire.name.toLowerCase().includes(filter.toLowerCase())
              : true;
          });
      }),
      shareReplay(1)
    );
  }

  private getSelectedQuestionnaire(): Observable<Questionnaire> {
    return this.form.controls.comparativeValues.controls.questionnaire.valueChanges.pipe(
      filter((selectedQuestionnaire) => !!selectedQuestionnaire),
      combineLatestWith(this.selectableQuestionnaires$),
      map(([selectedQuestionnaire, selectableQuestionnaires]) => {
        return selectableQuestionnaires.find(
          (questionnaire) =>
            questionnaire.id === Number(selectedQuestionnaire.id) &&
            questionnaire.version === Number(selectedQuestionnaire.version)
        );
      }),
      filter((questionnaire) => !!questionnaire),
      tap((questionnaire) => {
        // reset answer option value codes form
        this.form.controls.comparativeValues.controls.answerOptionValueCodes.reset();

        // set start date of time range to first questionnaire release date
        this.setStartDateOfTimeRange(questionnaire);
      }),
      tap(() => this.resetTimeSeries()),
      shareReplay(1)
    );
  }

  private getSelectableAnswerOptions(): Observable<AnswerOption[]> {
    return this.answerOptionFilterCtrl.valueChanges.pipe(
      startWith(null),
      combineLatestWith(this.selectedQuestionnaire$),
      filter(([_answerOptionFilter, questionnaire]) => !!questionnaire),
      map(([answerOptionFilter, questionnaire]) =>
        questionnaire.questions
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
          )
      )
    );
  }

  private getSelectedAnswerOption(): Observable<AnswerOption> {
    return this.form.controls.comparativeValues.controls.answerOptionValueCodes.controls.id.valueChanges.pipe(
      combineLatestWith(this.selectableAnswerOptions$),
      filter(([answerOptionId, _selectableAnswerOptions]) => !!answerOptionId),
      map(([answerOptionId, selectableAnswerOptions]) =>
        selectableAnswerOptions.find(
          (answerOption) => answerOption.id === answerOptionId
        )
      ),
      tap((answerOption) => {
        // set corresponding variable name
        this.form.controls.comparativeValues.controls.answerOptionValueCodes.controls.variableName.setValue(
          answerOption?.variable_name ?? null
        );
        // reset selected answer option value codes
        this.form.controls.comparativeValues.controls.answerOptionValueCodes.controls.valueCodes.reset();
      })
    );
  }

  private getSelectableAnswerOptionValues(): Observable<AnswerOptionValue[]> {
    return this.selectedAnswerOption$.pipe(
      map((answerOption) =>
        answerOption.values_code.map((valueCode, index) => ({
          text: answerOption.values[index],
          code: valueCode,
        }))
      )
    );
  }

  private setStartDateOfTimeRange(questionnaire: Questionnaire): void {
    if (this.form.controls.timeRange.controls.startDate.value) {
      return;
    }
    this.form.controls.timeRange.controls.startDate.setValue(
      this.getFirstReleaseDateOfQuestionaire(questionnaire)
    );
  }

  private getFirstReleaseDateOfQuestionaire(
    questionnaire: Questionnaire
  ): Date {
    return addDays(
      new Date(questionnaire.updated_at),
      questionnaire.activate_after_days
    );
  }

  private getSelectableColors(): Observable<string[]> {
    return this.form.controls.timeSeries.valueChanges.pipe(
      startWith(null),
      map(() => {
        const colorsInUse = this.form.controls.timeSeries.controls.map(
          (timeSeries) => timeSeries.controls.color.value
        );
        return RelativeFrequencyTimeSeriesConfigurationComponent.availableColors.filter(
          (color) => !colorsInUse.includes(color)
        );
      })
    );
  }
}
