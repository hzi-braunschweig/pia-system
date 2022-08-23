/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  HostListener,
  Inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import {
  Condition,
  ConditionLink,
  ConditionOperand,
  ConditionType,
  Questionnaire,
} from '../../../psa.app.core/models/questionnaire';
import { Question } from '../../../psa.app.core/models/question';
import { AlertService } from '../../../_services/alert.service';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AnswerOption, Value } from '../../../psa.app.core/models/answerOption';
import { Answer } from '../../../psa.app.core/models/answer';
import { SwiperComponent } from 'ngx-useful-swiper';
import { SwiperOptions } from 'swiper';
import { ComponentCanDeactivate } from '../../../_guards/pending-changes.guard';
import { TranslateService } from '@ngx-translate/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import {
  APP_DATE_FORMATS,
  AppDateAdapter,
} from '../../../_helpers/date-adapter';
import { QuestionnaireInstanceQueue } from '../../../psa.app.core/models/questionnaireInstanceQueue';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { DOCUMENT, Location } from '@angular/common';
import { timeout } from 'rxjs/operators';
import { Tools } from './tools';
import {
  HistoryItem,
  QuestionItem,
} from 'src/app/psa.app.core/models/historyItem';
import { Study } from 'src/app/psa.app.core/models/study';
import { RequiredAnswerValidator } from './required-answer-validator';
import { HttpErrorResponse } from '@angular/common/http';
import { SelectedProbandInfoService } from '../../../_services/selected-proband-info.service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { AnswerType } from '../../../psa.app.core/models/answerType';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { Proband } from '../../../psa.app.core/models/proband';
import { CurrentUser } from '../../../_services/current-user.service';
import { MatRadioButton } from '@angular/material/radio';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { addDays, format, isAfter } from 'date-fns';

export enum DisplayStatus {
  QUESTIONS,
  OVERVIEW,
  HISTORY,
}

interface AnswerOptionFormValue {
  answer_type_id: number;
  show_answer_option: boolean;
  values: FormArray;
  hasValue: boolean;
  text: string;
  id: number;
  question_id: number | string;
  value: string | Date;
  is_condition_target: string | boolean;
  condition?: ConditionFormValue;
}

interface QuestionFormValue {
  id: number;
  text: string;
  is_mandatory: boolean;
  show_question: boolean;
  show_question_answer_condition: boolean;
  counterOfDisabledAnswerOptionsInQuestion: number;
  answer_options: AnswerOptionFormValue[];
  condition?: ConditionFormValue;
}

interface ConditionFormValue {
  condition_type: ConditionType.INTERNAL_THIS | null;
  condition_target_questionnaire: number;
  condition_target_answer_option: number;
  condition_operand: ConditionOperand | null;
  condition_value: string;
  condition_link: ConditionLink | null;
}

@Component({
  templateUrl: 'question-proband.component.html',
  styleUrls: ['question-proband.component.scss'],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'de' },
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
export class QuestionProbandComponent
  implements ComponentCanDeactivate, OnInit, OnDestroy
{
  public myForm: FormGroup;
  public questionnaireInstanceId: number | undefined;
  private questionnaire: Questionnaire;
  public studyOfQuestionnaire: Study = null;
  public readonly DisplayStatus = DisplayStatus;
  public displayStatus: DisplayStatus = DisplayStatus.QUESTIONS;
  public currentHistory: HistoryItem[] = [];
  public questionnaire_instance_status: string;
  public date_of_issue: Date;
  public isLoading: boolean = false;
  public answerIdsFromServer: number[] = [];
  public pseudonym: string;
  public answerVersionFromServer: number;
  public release_version: number;

  @ViewChild('questionSwiper')
  public questionSwiper: SwiperComponent;
  public readonly config: SwiperOptions = {
    pagination: { el: '.swiper-pagination', clickable: false },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
      disabledClass: 'swiper-navigation-disabled',
    },
    simulateTouch: false,
    spaceBetween: 30,
  };

  public canDeactivate(): Observable<boolean> | boolean {
    return this.myForm ? !this.myForm.dirty : true;
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload', ['$event'])
  public unloadNotification($event: any): void {
    if (!this.canDeactivate()) {
      // This message is displayed to the user in IE and Edge when they navigate without using Angular routing (type another URL/close the browser/etc)
      $event.returnValue = this.translate.instant('WARNING.ANSWERS');
    }
  }

  constructor(
    public readonly user: CurrentUser,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    private userService: UserService,
    private selectedProbandInfoService: SelectedProbandInfoService,
    private questionnaireService: QuestionnaireService,
    private sampleTrackingService: SampleTrackingService,
    private dialog: MatDialog,
    private _location: Location,
    @Inject(DOCUMENT) private document: Document
  ) {
    if (this.activatedRoute.snapshot.paramMap.has('instanceId')) {
      this.questionnaireInstanceId = Number(
        this.activatedRoute.snapshot.paramMap.get('instanceId')
      );
    }
  }

  public async ngOnInit(): Promise<void> {
    this.isLoading = true;
    try {
      const result: QuestionnaireInstance =
        await this.questionnaireService.getQuestionnaireInstance(
          this.questionnaireInstanceId
        );
      this.questionnaire_instance_status = result.status
        ? result.status
        : 'active';
      this.date_of_issue = result.date_of_issue;
      this.pseudonym = result.user_id;
      this.release_version = result.release_version;
      this.questionnaire = result.questionnaire;

      /**
       * Get study for sample configuration
       *
       * Currently, the GET API for probands is still implemented in the
       * QuestionnaireService for backwards compatability. Later probands
       * and admins should use the UserService to get the study.
       */
      if (this.user.isProband()) {
        this.studyOfQuestionnaire = await this.questionnaireService.getStudy(
          this.questionnaire.study_id
        );
      } else {
        this.studyOfQuestionnaire = await this.userService.getStudy(
          this.questionnaire.study_id
        );
      }

      if (this.user.hasRole('Untersuchungsteam')) {
        const proband = await this.authService.getProband(this.pseudonym);
        this.selectedProbandInfoService.updateSideNavInfoSelectedProband({
          ids: proband.ids,
          pseudonym: proband.pseudonym,
        });
      }
      await this.initForm(this.questionnaire); // handles both the create and edit logic
    } catch (err) {
      console.error(err);
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  public ngOnDestroy(): void {
    if (this.user.hasRole('Untersuchungsteam')) {
      this.selectedProbandInfoService.updateSideNavInfoSelectedProband(null);
    }
  }

  /**
   * Initialises the myForm
   * @method initForm
   */
  private async initForm(questionnaire?: Questionnaire): Promise<void> {
    const name = this.questionnaire.name;
    this.myForm = new FormGroup({
      name: new FormControl(name),
      questions: new FormArray([]),
    });
    const result = await this.questionnaireService.getAnswers(
      this.questionnaireInstanceId
    );
    const answers = result.answers;
    this.answerVersionFromServer = answers[0] ? answers[0].versioning : 0;

    questionnaire.questions.forEach((question, questionIndex) => {
      this.addQuestion(question);
      question.answer_options.forEach((answerOption, answerOptionIndex) => {
        const valueList: Value[] = [];
        if (answers.length !== 0) {
          answers.forEach((answer) => {
            if (answerOption.id === answer.answer_option_id) {
              this.answerIdsFromServer.push(answer.answer_option_id);
              if (answerOption.answer_type_id === 2) {
                const arrayValue: string[] = answer.value.split(';');
                for (let i = 0; i < answerOption.values.length; i++) {
                  valueList.push({
                    is_notable: answerOption.is_notable
                      ? answerOption.is_notable[i]
                      : null,
                    value: answerOption.values[i],
                    value_coded: answerOption.values_code
                      ? answerOption.values_code[i]
                      : null,
                    isChecked: false,
                  });
                  arrayValue.forEach((valueString) => {
                    if (answerOption.values[i].toString() === valueString) {
                      valueList[i].isChecked = true;
                    }
                  });
                }
              }
              answerOption.answer_value = answer.value;
            }
          });
          if (valueList.length === 0) {
            for (let i = 0; i < answerOption.values.length; i++) {
              valueList.push({
                is_notable: answerOption.is_notable
                  ? answerOption.is_notable[i]
                  : null,
                value: answerOption.values[i],
                value_coded: answerOption.values_code
                  ? answerOption.values_code[i]
                  : null,
                isChecked: false,
              });
            }
          }
        } else {
          for (let i = 0; i < answerOption.values.length; i++) {
            valueList.push({
              is_notable: answerOption.is_notable
                ? answerOption.is_notable[i]
                : null,
              value: answerOption.values[i],
              value_coded: answerOption.values_code
                ? answerOption.values_code[i]
                : null,
              isChecked: false,
            });
          }
        }
        this.addAnswer(questionIndex, answerOption);
        if (answerOption.answer_type_id === 2) {
          valueList.forEach((valueItem) => {
            this.addValue(questionIndex, answerOptionIndex, null, valueItem);
          });
        } else {
          answerOption.values.forEach((value) => {
            this.addValue(questionIndex, answerOptionIndex, value);
          });
        }
      });
    });

    questionnaire.questions.forEach(
      (questionAfterInitForm, questionIndexAfterInitForm) => {
        questionAfterInitForm.answer_options.forEach(
          (answer_option, answer_optionIndex) => {
            this.checkConditions(
              questionIndexAfterInitForm,
              answer_optionIndex
            );
          }
        );
      }
    );
  }

  /**
   * Adds a question FormGroup to the questionnaire <FormArray>FormControl(questions)
   */
  private addQuestion(question?: Question): void {
    const text = question ? this.calculatAppropriateDate(question.text) : '';
    const is_mandatory =
      question && question.is_mandatory ? question.is_mandatory : false;
    const id = question ? question.id : '';
    const questionIndex = (this.myForm.get('questions') as FormArray).length;

    (this.myForm.get('questions') as FormArray).push(
      new FormGroup({
        id: new FormControl(id),
        text: new FormControl(text),
        is_mandatory: new FormControl(is_mandatory),
        show_question: new FormControl(
          !(
            question &&
            question.condition &&
            question.condition.condition_type === 'internal_this'
          )
        ),
        show_question_answer_condition: new FormControl(true),
        counterOfDisabledAnswerOptionsInQuestion: new FormControl(0),
        answer_options: new FormArray([]),
      })
    );
    if (
      question.condition &&
      question.condition.condition_type === 'internal_this'
    ) {
      this.addQuestionCondition(questionIndex, question.condition);
    }
  }

  /**
   * Replace the value in days with a date
   *
   * @param inputText input string for convert vaues to dates
   */
  private calculatAppropriateDate(inputText: string): string {
    const myRegex = /\(dat=(.*?)\)/g;
    let str = inputText ? inputText : '';
    while (true) {
      const myArray = myRegex.exec(str);
      if (!myArray) {
        break;
      }
      const days = Number.parseInt(myArray[1], 10);
      const replacementDate = addDays(new Date(this.date_of_issue), days);
      str = str.replace(myArray[0], format(replacementDate, 'dd.MM.yyyy'));
    }
    return str;
  }

  private addQuestionCondition(
    questionIndex: number,
    condition: Condition
  ): void {
    const questionControl =
      this.getQuestionFormControlAtPosition(questionIndex);

    questionControl.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(condition.condition_type),
        condition_target_questionnaire: new FormControl(
          condition.condition_target_questionnaire
        ),
        condition_target_answer_option: new FormControl(
          condition.condition_target_answer_option
        ),
        condition_operand: new FormControl(condition.condition_operand),
        condition_value: new FormControl(condition.condition_value),
        condition_link: new FormControl(condition.condition_link),
      })
    );
  }

  /**
   * Adds a AnswerOption FormGroup to the question's <FormArray>FormControl(answer)
   */
  private addAnswer(questionIndex: number, answerOption?: AnswerOption): void {
    const text = answerOption
      ? this.calculatAppropriateDate(answerOption.text)
      : '';
    const answer_type_id: AnswerType = answerOption
      ? answerOption.answer_type_id
      : null;
    const answer_id = answerOption ? answerOption.id : null;
    const question_id = answerOption ? answerOption.question_id : '';
    const is_condition_target = answerOption
      ? answerOption.is_condition_target
      : '';
    let hasValue = false;

    let answer_value: string | Date;
    if (answerOption) {
      answer_value = answerOption.answer_value ? answerOption.answer_value : '';
      if (answer_value !== '' && answer_type_id === AnswerType.Date) {
        answer_value = new Date(answer_value);
      }
      if (answer_type_id === AnswerType.Sample) {
        hasValue = !!answer_value;
      }
    } else {
      answer_value = '';
    }

    const answerOptions: FormArray = this.getQuestionFormControlAtPosition(
      questionIndex
    ).get('answer_options') as FormArray;

    answerOptions.push(
      new FormGroup({
        text: new FormControl(text),
        id: new FormControl(answer_id),
        question_id: new FormControl(question_id),
        answer_type_id: new FormControl(answer_type_id),
        show_answer_option: new FormControl(
          !(
            answerOption &&
            answerOption.condition &&
            answerOption.condition.condition_type === 'internal_this'
          )
        ),
        is_condition_target: new FormControl(is_condition_target),
        value: new FormControl(answer_value),
        values: new FormArray([]),
        hasValue: new FormControl(hasValue),
      })
    );

    const answerIndex = answerOptions.length - 1;
    const answerControl: FormGroup = answerOptions.at(answerIndex) as FormGroup;
    const is_mandatory =
      this.getQuestionFormControlAtPosition(questionIndex).get(
        'is_mandatory'
      ).value;

    if (is_mandatory) {
      answerControl.setValidators(RequiredAnswerValidator.answerRequired);
    }

    if (answer_type_id === AnswerType.Number) {
      answerControl.addControl(
        'restriction_min',
        new FormControl(answerOption.restriction_min)
      );
      answerControl.addControl(
        'restriction_max',
        new FormControl(answerOption.restriction_max)
      );
      if (
        answerOption.restriction_min != null &&
        answerOption.restriction_max != null
      ) {
        answerControl.setValidators(Tools.checkValueRanges);
      }
      answerControl.addControl(
        'is_decimal',
        new FormControl(answerOption.is_decimal)
      );
      if (answerOption.is_decimal) {
        answerControl.get('value').setValidators(Tools.checkIfNumberIsDecimal);
      } else {
        answerControl.get('value').setValidators(Tools.checkIfNumberIsInteger);
      }
    }

    if (answer_type_id === AnswerType.Sample) {
      const sample_ids: string[] = answerOption.answer_value
        ? answerOption.answer_value.split(';')
        : [null, null];
      answerControl.addControl(
        'sample_id_1',
        new FormControl(sample_ids[0], [this.validateSampleID.bind(this)])
      );
      if (this.studyOfQuestionnaire.has_rna_samples) {
        answerControl.addControl(
          'sample_id_2',
          new FormControl(sample_ids[1], [this.validateSampleID.bind(this)])
        );
      }
    }

    if (answer_type_id === AnswerType.Date) {
      const restriction_min =
        answerOption.restriction_min !== null
          ? Tools.countDateFromToday(answerOption.restriction_min)
          : null;
      const restriction_max =
        answerOption.restriction_max !== null
          ? Tools.countDateFromToday(answerOption.restriction_max)
          : null;
      answerControl.addControl(
        'restriction_min',
        new FormControl(restriction_min)
      );
      answerControl.addControl(
        'restriction_max',
        new FormControl(restriction_max)
      );
      if (
        answerOption.restriction_min != null &&
        answerOption.restriction_max != null
      ) {
        answerControl.setValidators(Tools.checkValueRanges);
      }
    }

    if (
      answerOption.condition &&
      answerOption.condition.condition_type === 'internal_this'
    ) {
      this.addAnswerCondition(
        questionIndex,
        answerIndex,
        answerOption.condition
      );
    }
    answerControl.updateValueAndValidity();
  }

  private getQuestionFormControlAtPosition(
    questionIndex: number
  ): FormGroup & { value: QuestionFormValue } {
    return (this.myForm.get('questions') as FormArray).at(
      questionIndex
    ) as FormGroup;
  }

  private getAnswerOptionFormControlAtPosition(
    questionIndex: number,
    answerIndex: number
  ): FormGroup & { value: AnswerOptionFormValue } {
    return (
      this.getQuestionFormControlAtPosition(questionIndex).get(
        'answer_options'
      ) as FormArray
    ).at(answerIndex) as FormGroup;
  }

  private addAnswerCondition(
    questionIndex: number,
    answerIndex: number,
    condition: Condition
  ): void {
    const answerControl = this.getAnswerOptionFormControlAtPosition(
      questionIndex,
      answerIndex
    );

    answerControl.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(condition.condition_type),
        condition_target_questionnaire: new FormControl(
          condition.condition_target_questionnaire
        ),
        condition_target_answer_option: new FormControl(
          condition.condition_target_answer_option
        ),
        condition_operand: new FormControl(condition.condition_operand),
        condition_value: new FormControl(condition.condition_value),
      })
    );
  }

  private addValue(
    questionIndex: number,
    answerIndex: number,
    value?: string,
    valueList?: Value
  ): void {
    let text: string | Date;
    if (value) {
      if (
        this.getAnswerOptionFormControlAtPosition(
          questionIndex,
          answerIndex
        ).get('answer_type_id').value === '5'
      ) {
        text = new Date(value);
      } else {
        text = value;
      }
    } else if (valueList) {
      text = valueList.value;
    } else {
      text = '';
    }
    const isChecked = valueList ? valueList.isChecked : false;
    (
      this.getAnswerOptionFormControlAtPosition(questionIndex, answerIndex).get(
        'values'
      ) as FormArray
    ).push(
      new FormGroup({
        value: new FormControl(text),
        isChecked: new FormControl(isChecked),
      })
    );
  }

  public onChange(
    input: HTMLInputElement,
    questionIndex: number,
    answerIndex: number
  ): void {
    const answerValue = this.getAnswerOptionFormControlAtPosition(
      questionIndex,
      answerIndex
    ).get('value');
    const answerValues =
      this.getAnswerOptionFormControlAtPosition(questionIndex, answerIndex).get(
        'values'
      ).value != null
        ? this.getAnswerOptionFormControlAtPosition(
            questionIndex,
            answerIndex
          ).get('values').value
        : '';
    const stringValue: string =
      answerValue.value != null ? answerValue.value.toString() : '';

    if (input.checked) {
      if (input.value === 'Keine Angabe') {
        answerValue.setValue(input.value);
        // always use setValue() instead of value =
        answerValues.forEach((answerValueControl) => {
          answerValueControl.isChecked =
            answerValueControl.value === input.value;
        });
      } else {
        const arrayValue: string[] = stringValue.split(';');
        const index = arrayValue.findIndex((x) => x === 'Keine Angabe');
        if (index !== -1) {
          arrayValue.splice(index, 1);
          if (arrayValue.length === 0) {
            answerValue.setValue(input.value);
          } else {
            answerValue.setValue(input.value + ';' + arrayValue.join(';'));
          }
        } else {
          answerValue.setValue(input.value + ';' + stringValue);
        }
        answerValues.forEach((answerValueControl) => {
          if (answerValueControl.value === input.value) {
            answerValueControl.isChecked = true;
          } else if (answerValueControl.value === 'Keine Angabe') {
            answerValueControl.isChecked = false;
          }
        });
      }
    } else {
      const arrayValue: string[] = stringValue.split(';');
      const i = arrayValue.findIndex((x) => x === input.value);
      arrayValue.splice(i, 1);
      if (arrayValue.length === 0) {
        answerValue.setValue('');
      } else {
        answerValue.setValue(arrayValue.join(';'));
      }
      answerValues.forEach((answerValueControl) => {
        if (answerValueControl.value === input.value) {
          answerValueControl.isChecked = false;
        }
      });
    }
    this.checkConditions(questionIndex, answerIndex);
  }

  public goToAnswersView(sendAnswers: boolean): void {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    if (this.shouldLockActualSwipe(questionIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    } else {
      if (sendAnswers) {
        this.postAllAnswers(false);
      }
      this.displayStatus = DisplayStatus.OVERVIEW;
      const x = this.document.getElementById('questionSwiper');
      x.style.display = 'none';
    }
  }

  public async goToHistoryView(): Promise<void> {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    if (this.shouldLockActualSwipe(questionIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    } else {
      await this.postAllAnswers(false);
      await this.buildCurrentHistory();
      this.displayStatus = DisplayStatus.HISTORY;
      const x = this.document.getElementById('questionSwiper');
      x.style.display = 'none';
    }
  }

  private async buildCurrentHistory(): Promise<void> {
    this.currentHistory = [];
    const histAnswers = await this.questionnaireService.getHistoricalAnswers(
      this.questionnaireInstanceId
    );

    let newHistoryItem: HistoryItem = null;

    let newQuestionItem: QuestionItem = new QuestionItem();
    newQuestionItem.subquestion_items = [];

    histAnswers.forEach((answer) => {
      // start from version 2
      if (answer.versioning === 1) {
        return;
      }

      // create new history item on first iteration
      if (newHistoryItem == null) {
        newHistoryItem = new HistoryItem();
        newHistoryItem.versioning = answer.versioning;
        newHistoryItem.date_of_release_old = new Date(0);
        newHistoryItem.date_of_release_new =
          answer.versioning > this.release_version
            ? null
            : answer.date_of_release;
        newHistoryItem.releasing_person_old = '';
        newHistoryItem.releasing_person_new = answer.releasing_person;
        newHistoryItem.question_items = [];
      }

      // create new history item and add old one to array
      if (newHistoryItem.versioning !== answer.versioning) {
        if (newQuestionItem.subquestion_items.length > 0) {
          const questionItemToPush = JSON.parse(
            JSON.stringify(newQuestionItem)
          );
          newHistoryItem.question_items.push(questionItemToPush);
        }

        if (newHistoryItem.question_items.length > 0) {
          const historyItemToPush = JSON.parse(JSON.stringify(newHistoryItem));
          this.currentHistory.push(historyItemToPush);
        }

        newHistoryItem = new HistoryItem();
        newHistoryItem.versioning = answer.versioning;
        newHistoryItem.date_of_release_old = new Date(0);
        newHistoryItem.date_of_release_new =
          answer.versioning > this.release_version
            ? null
            : answer.date_of_release;
        newHistoryItem.releasing_person_old = '';
        newHistoryItem.releasing_person_new = answer.releasing_person;
        newHistoryItem.question_items = [];

        newQuestionItem = new QuestionItem();
        newQuestionItem.subquestion_items = [];
      }

      // create new question item
      const question: Question = this.getQuestionFromID(answer.question_id);
      if (newQuestionItem.description !== question.text) {
        if (newQuestionItem.subquestion_items.length > 0) {
          const questionItemToPush = JSON.parse(
            JSON.stringify(newQuestionItem)
          );
          newHistoryItem.question_items.push(questionItemToPush);
        }

        newQuestionItem = new QuestionItem();
        newQuestionItem.description = question.text;
        newQuestionItem.subquestion_items = [];
        newQuestionItem.position = question.position;
      }

      // create new subquestion item
      const lastAnswer = this.getLastAnswer(
        answer.answer_option_id,
        answer.versioning,
        histAnswers
      );
      if (lastAnswer.value !== answer.value) {
        const subquestion = this.getSubquestionFromID(answer.answer_option_id);
        newQuestionItem.subquestion_items.push({
          position: subquestion.position,
          description: subquestion.text,
          value_old: this.presentAnswerValue(lastAnswer.value, subquestion),
          value_new: this.presentAnswerValue(answer.value, subquestion),
        });
        if (
          isAfter(
            new Date(lastAnswer.date_of_release),
            new Date(newHistoryItem.date_of_release_old)
          )
        ) {
          newHistoryItem.date_of_release_old = lastAnswer.date_of_release;
        }
        if (newHistoryItem.releasing_person_old === '') {
          newHistoryItem.releasing_person_old = lastAnswer.releasing_person;
        }
      }
    });

    if (newQuestionItem.subquestion_items.length > 0) {
      const questionItemToPush = JSON.parse(JSON.stringify(newQuestionItem));
      newHistoryItem.question_items.push(questionItemToPush);
    }

    if (
      newHistoryItem &&
      newHistoryItem.question_items &&
      newHistoryItem.question_items.length > 0
    ) {
      const historyItemToPush = JSON.parse(JSON.stringify(newHistoryItem));
      this.currentHistory.push(historyItemToPush);
    }
  }

  private presentAnswerValue(value: string, subquestion: AnswerOption): string {
    let result = '';
    if (value === '') {
      return this.translate.instant('ANSWERS_HISTORY.NO_ANSWER');
    }

    switch (subquestion.answer_type_id) {
      case 1: {
        result = value;
        break;
      }
      case 2: {
        result = value.replace(';', ', ');
        break;
      }
      case 3: {
        result = value;
        break;
      }
      case 4: {
        result = value;
        break;
      }
      case 5: {
        result = format(new Date(value), 'dd.MM.yyyy');
        break;
      }
      case 6: {
        result = value;
        break;
      }
      case 7: {
        result = value;
        break;
      }
      case 8: {
        result = value;
        break;
      }
      case 9: {
        result = format(new Date(Number(value)), 'dd.MM.yyyy - HH:mm:ss');
        break;
      }
      case 10: {
        result = value;
        break;
      }
      default: {
        result = value;
        break;
      }
    }
    return result;
  }

  private getLastAnswer(id, curVersioning, histAnswers): Partial<Answer> {
    const reversedHistAnswers = JSON.parse(JSON.stringify(histAnswers));
    reversedHistAnswers.reverse();
    const foundAnswer: Answer = reversedHistAnswers.find((answer: Answer) => {
      return (
        answer.versioning < curVersioning && answer.answer_option_id === id
      );
    });
    return foundAnswer
      ? foundAnswer
      : { value: '', date_of_release: new Date(0), releasing_person: '' };
  }

  private getQuestionFromID(id): Question {
    return this.questionnaire.questions.find((question: Question) => {
      return question.id === id;
    });
  }

  private getSubquestionFromID(id: number): AnswerOption {
    let foundSubQuestion: AnswerOption = null;
    this.questionnaire.questions.find((question: Question) => {
      const subQuestion = question.answer_options.find(
        (answer_option: AnswerOption) => {
          return answer_option.id === id;
        }
      );
      if (subQuestion) {
        foundSubQuestion = subQuestion;
        return true;
      } else {
        return false;
      }
    });
    return foundSubQuestion;
  }

  public onClickQuestion(questionIndex: number): void {
    const questionActiveIndex = this.questionSwiper.swiper.activeIndex;
    this.questionSwiper.swiper.allowSlidePrev = true;
    this.questionSwiper.swiper.allowSlideNext = true;

    if (
      this.displayStatus !== DisplayStatus.OVERVIEW &&
      this.shouldLockActualSwipe(questionActiveIndex)[0]
    ) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionActiveIndex)[1]);
    } else {
      this.postAllAnswers(false);
      this.displayStatus = DisplayStatus.QUESTIONS;
      const x = this.document.getElementById('questionSwiper');
      x.style.display = 'block';
      this.questionSwiper.swiper.slideTo(questionIndex);
    }
  }

  public onSwipeNext(): void {
    if (this.isLoading) {
      return;
    }
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    this.questionSwiper.swiper.allowSlidePrev = true;
    this.questionSwiper.swiper.allowSlideNext = true;

    if (this.shouldLockActualSwipe(questionIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    } else {
      this.postAllAnswers(false);
      this.goToNextSlide();
    }
  }

  public onSwipePrev(): void {
    if (this.isLoading) {
      return;
    }
    const questionIndex = this.questionSwiper.swiper.activeIndex;

    this.questionSwiper.swiper.allowSlidePrev = true;
    this.questionSwiper.swiper.allowSlideNext = true;

    const questionControl = this.myForm.get('questions') as FormArray;
    if (this.shouldLockActualSwipe(questionIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    } else {
      this.postAllAnswers(false);
      for (let i = questionIndex; i >= 0; i--) {
        if (questionControl.at(i - 1) as FormGroup) {
          if (
            (questionControl.at(i - 1) as FormGroup).get('show_question')
              .value === true &&
            (questionControl.at(i - 1) as FormGroup).get(
              'show_question_answer_condition'
            ).value === true
          ) {
            this.questionSwiper.swiper.slideTo(i);
            break;
          } else if (i === 0) {
            this.questionSwiper.swiper.slideTo(questionIndex);
            break;
          }
        } else {
          this.questionSwiper.swiper.slideTo(questionIndex + 1);
          break;
        }
      }
    }
  }

  private showLockWarning(message: string): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '350px',
      data: { content: message, isSuccess: false },
    });
  }

  private shouldLockActualSwipe(actualSwipeIndex): [boolean, string] {
    let actualSwipeShouldBeLocked = false;
    let message = 'ANSWERS_PROBAND.CURRENT_QUESTION';
    const questions = this.myForm.get('questions') as FormArray;
    const actualQuestionIsMandatory = (
      questions.at(actualSwipeIndex) as FormGroup
    ).get('is_mandatory').value;
    const answerOptionsControl = (
      questions.at(actualSwipeIndex) as FormGroup
    ).get('answer_options') as FormArray;

    // check if there any answer options that are shown but not answered
    for (let i = 0; i < answerOptionsControl.length; i++) {
      const hasError =
        (answerOptionsControl.at(i) as FormGroup)
          .get('value')
          .hasError('valuesValidate') ||
        (answerOptionsControl.at(i) as FormGroup)
          .get('value')
          .hasError('notDecimalNumber') ||
        (answerOptionsControl.at(i) as FormGroup)
          .get('value')
          .hasError('notNumber');
      const isNotAnswered =
        (answerOptionsControl.at(i) as FormGroup).get('value').value === '';
      const isShown = (answerOptionsControl.at(i) as FormGroup).get(
        'show_answer_option'
      ).value;

      if (
        (answerOptionsControl.at(i) as FormGroup).get('answer_type_id')
          .value === 6 &&
        ((answerOptionsControl.at(i) as FormGroup).get('sample_id_1').value ||
          (this.studyOfQuestionnaire.has_rna_samples &&
            (answerOptionsControl.at(i) as FormGroup).get('sample_id_2')
              .value)) &&
        !(answerOptionsControl.at(i) as FormGroup).get('hasValue').value
      ) {
        actualSwipeShouldBeLocked = true;
        message = 'ANSWERS_PROBAND.CURRENT_SAMPLE_IDs';
        break;
      }

      if (hasError) {
        actualSwipeShouldBeLocked = true;
        break;
      }

      if (actualQuestionIsMandatory && isShown) {
        if (
          (answerOptionsControl.at(i) as FormGroup).get('answer_type_id')
            .value === 6 &&
          !(answerOptionsControl.at(i) as FormGroup).get('hasValue').value
        ) {
          actualSwipeShouldBeLocked = true;
          message = 'ANSWERS_PROBAND.CURRENT_SAMPLE_IDs';
          break;
        } else if (
          (answerOptionsControl.at(i) as FormGroup).get('answer_type_id')
            .value !== 6 &&
          isNotAnswered
        ) {
          actualSwipeShouldBeLocked = true;
          break;
        }
      }
    }
    return [actualSwipeShouldBeLocked, message];
  }

  public checkConditions(questionIndex: number, answerIndex: number): void {
    const questionControl = this.myForm.get('questions') as FormArray;
    // answerOptions control for current question
    const answerControlActiveQuestion: AnswerOptionFormValue =
      this.getAnswerOptionFormControlAtPosition(
        questionIndex,
        answerIndex
      ).value;
    // answerControlActiveQuestion.updateValueAndValidity();
    const questionAndAnswerIndexesToCheckConditionAgain = [];
    questionControl
      .getRawValue()
      .forEach((question: QuestionFormValue, questionIndexFromList) => {
        const singleQuestionControl = questionControl.at(
          questionIndexFromList
        ) as FormGroup;
        if (
          question.condition &&
          question.condition.condition_type === 'internal_this' &&
          question.condition.condition_target_answer_option ===
            answerControlActiveQuestion.id
        ) {
          let conditionMatches = false;
          if (answerControlActiveQuestion.value) {
            conditionMatches = this.isConditionMet(
              answerControlActiveQuestion,
              question.condition
            );
          }
          if (!conditionMatches) {
            singleQuestionControl.get('show_question').setValue(false);
            const answerOptionsControl = singleQuestionControl.get(
              'answer_options'
            ) as FormArray;
            for (let i = 0; i < answerOptionsControl.length; i++) {
              const answerOptionID = (
                answerOptionsControl.at(i) as FormGroup
              ).get('id').value;
              // delete answers if exist on server
              if (
                (answerOptionsControl.at(i) as FormGroup).get('answer_type_id')
                  .value !== 6
              ) {
                (answerOptionsControl.at(i) as FormGroup)
                  .get('value')
                  .setValue('');
                const index = this.answerIdsFromServer.findIndex(
                  (answerOptionIDToCheck) =>
                    answerOptionIDToCheck === answerOptionID
                );
                if (index !== -1) {
                  this.answerIdsFromServer.splice(index, 1);
                  this.questionnaireService.deleteAnswer(
                    this.questionnaireInstanceId,
                    answerOptionID
                  );
                }
              }
              const answerCheckboxValues =
                this.getAnswerOptionFormControlAtPosition(
                  questionIndexFromList,
                  i
                ).get('values') as FormArray;
              if (
                answerCheckboxValues &&
                (answerOptionsControl.at(i) as FormGroup).get('answer_type_id')
                  .value === 2
              ) {
                answerCheckboxValues.value.forEach(
                  (answerCheckboxValue, answerCheckboxValueIndex) => {
                    (
                      answerCheckboxValues.at(
                        answerCheckboxValueIndex
                      ) as FormGroup
                    )
                      .get('isChecked')
                      .setValue(false);
                  }
                );
              }

              if (
                (answerOptionsControl.at(i) as FormGroup).get(
                  'is_condition_target'
                ).value
              ) {
                questionAndAnswerIndexesToCheckConditionAgain.push({
                  questionIndex: questionIndexFromList,
                  answerIndex: i,
                });
              }
            }
            singleQuestionControl.disable();
          } else {
            singleQuestionControl.get('show_question').setValue(true);
            singleQuestionControl.enable();
          }
        }

        const answers = async () => {
          if (question.answer_options) {
            question.answer_options.forEach(
              async (answerOption, answerOptionIndex) => {
                // answerOptions control for question from list
                const answerOptionControl =
                  this.getAnswerOptionFormControlAtPosition(
                    questionIndexFromList,
                    answerOptionIndex
                  );
                if (
                  answerOption.condition &&
                  answerOption.condition.condition_type === 'internal_this' &&
                  answerOption.condition.condition_target_answer_option ===
                    answerControlActiveQuestion.id
                ) {
                  // answer from question has a condition on answer option from current question
                  let conditionMatches = false;
                  if (answerControlActiveQuestion.value != null) {
                    conditionMatches = this.isConditionMet(
                      answerControlActiveQuestion,
                      answerOption.condition
                    );
                  }
                  if (!conditionMatches) {
                    answerOptionControl
                      .get('show_answer_option')
                      .setValue(false);
                    answerOptionControl.get('value').setValue('');
                    // delete answers if exist on server
                    if (answerOptionControl.get('answer_type_id').value !== 6) {
                      const index = this.answerIdsFromServer.findIndex(
                        (answerOptionIDToCheck) =>
                          answerOptionIDToCheck === answerOption.id
                      );
                      if (index !== -1) {
                        this.answerIdsFromServer.splice(index, 1);
                        this.questionnaireService.deleteAnswer(
                          this.questionnaireInstanceId,
                          answerOption.id
                        );
                      }
                    }
                    const answerCheckboxValues =
                      this.getAnswerOptionFormControlAtPosition(
                        questionIndexFromList,
                        answerOptionIndex
                      ).get('values') as FormArray;
                    if (
                      answerCheckboxValues &&
                      answerOptionControl.get('answer_type_id').value === 2
                    ) {
                      answerCheckboxValues.value.forEach(
                        (answerCheckboxValue, answerCheckboxValueIndex) => {
                          (
                            answerCheckboxValues.at(
                              answerCheckboxValueIndex
                            ) as FormGroup
                          )
                            .get('isChecked')
                            .setValue(false);
                        }
                      );
                    }
                    answerOptionControl.disable();
                    if (!singleQuestionControl.value.answer_options) {
                      singleQuestionControl
                        .get('show_question_answer_condition')
                        .setValue(false);
                      singleQuestionControl.disable();
                    }

                    if (answerOptionControl.get('is_condition_target').value) {
                      questionAndAnswerIndexesToCheckConditionAgain.push({
                        questionIndex: questionIndexFromList,
                        answerIndex: answerOptionIndex,
                      });
                    }
                  } else {
                    answerOptionControl
                      .get('show_answer_option')
                      .setValue(true);
                    if (answerOptionControl.disabled) {
                      answerOptionControl.enable();
                    }
                    singleQuestionControl
                      .get('show_question_answer_condition')
                      .setValue(true);
                    if (singleQuestionControl.disabled) {
                      singleQuestionControl.enable();
                    }
                  }
                  singleQuestionControl.updateValueAndValidity();
                }
              }
            );
          }
        };
        answers();
      });
    if (questionAndAnswerIndexesToCheckConditionAgain.length !== 0) {
      questionAndAnswerIndexesToCheckConditionAgain.forEach(
        (questionAndAnswerIndexToCheckConditionAgain) => {
          this.checkConditions(
            questionAndAnswerIndexToCheckConditionAgain.questionIndex,
            questionAndAnswerIndexToCheckConditionAgain.answerIndex
          );
        }
      );
    }
    this.myForm.updateValueAndValidity();
  }

  public saveAndGoToOverview(questionIndex: number): void {
    if (!this.shouldLockActualSwipe(questionIndex)[0]) {
      this.postAllAnswers(false)
        .then(() => {
          this.dialog.open(DialogPopUpComponent, {
            width: '300px',
            data: {
              data: '',
              content: 'DIALOG.ANSWERS_SAVED',
              isSuccess: true,
            },
          });
          if (this.user.isProband()) {
            this.router.navigate(['questionnaires/user']);
          } else {
            this.router.navigate(['/questionnaires/user/'], {
              queryParams: { user_id: this.pseudonym },
            });
          }
        })
        .catch((err) => {
          this.alertService.errorObject(err);
        });
    } else {
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    }
  }

  public isQuestionnaireEmpty(): boolean {
    return !(this.myForm.get('questions') as FormArray).value.some(
      (question) => {
        return question.answer_options.some((answerOption) => {
          return !!answerOption.value;
        });
      }
    );
  }

  public async releaseAnswers(): Promise<void> {
    try {
      await this.postAllAnswers(true);
      if (this.user.isProband()) {
        if (
          this.questionnaire_instance_status === 'active' ||
          this.questionnaire_instance_status === 'in_progress'
        ) {
          this.questionnaire_instance_status = 'released_once';
        } else if (this.questionnaire_instance_status === 'released_once') {
          this.questionnaire_instance_status = 'released_twice';
        }
      } else if (this.user.hasRole('Untersuchungsteam')) {
        this.questionnaire_instance_status = 'released';
      }

      this.dialog.open(DialogPopUpComponent, {
        width: '300px',
        data: {
          data: '',
          content: 'DIALOG.ANSWERS_SUBMMITED',
          isSuccess: true,
        },
      });

      await this.questionnaireService.putQuestionnaireInstance(
        this.questionnaireInstanceId,
        {
          status: this.questionnaire_instance_status,
          progress: this.calculateProgress(),
          release_version: this.release_version + 1,
        }
      );
      if (this.user.isProband()) {
        this.findAndOpenNextInstance();
      } else {
        this.router.navigate([
          'studies/:studyName/probands',
          this.pseudonym,
          'questionnaireInstances',
        ]);
      }
    } catch (err) {
      this.alertService.errorObject(err);
    }
  }

  private formatAnswerOption(answerOption): Answer {
    if (
      answerOption.answer_type_id === 6 &&
      answerOption.sample_id_1 &&
      answerOption.sample_id_2
    ) {
      answerOption.value =
        answerOption.sample_id_1 + ';' + answerOption.sample_id_2;
    } else if (
      answerOption.answer_type_id === 6 &&
      answerOption.sample_id_1 &&
      !this.studyOfQuestionnaire.has_rna_samples
    ) {
      answerOption.value = answerOption.sample_id_1;
    }

    return {
      question_id: answerOption.question_id,
      answer_option_id: answerOption.id,
      value:
        answerOption.value != null && answerOption.value !== 'Invalid Date'
          ? answerOption.value.toString()
          : '',
      questionnaire_instance_id: undefined,
    };
  }

  private isConditionOfElementFulfilled(
    element: QuestionFormValue | AnswerOptionFormValue
  ): boolean {
    if (element) {
      if ('answer_options' in element && element.answer_options) {
        const atLeastOneAnswerOptionIsShown = element.answer_options.some(
          (answerOption) => {
            return (
              !answerOption.condition ||
              this.isConditionMet(
                this.getConditionTargetAnswer(answerOption.condition),
                answerOption.condition
              )
            );
          }
        );

        if (
          !atLeastOneAnswerOptionIsShown &&
          element.answer_options.length !== 0
        ) {
          return false;
        }
      }
      return (
        !element.condition ||
        this.isConditionMet(
          this.getConditionTargetAnswer(element.condition),
          element.condition
        )
      );
    } else {
      return false;
    }
  }

  private getConditionTargetAnswer(
    condition: ConditionFormValue
  ): AnswerOptionFormValue | null {
    for (const questionContorl of (this.myForm.get('questions') as FormArray)
      .controls) {
      for (const answerOptionContorl of (
        questionContorl.get('answer_options') as FormArray
      ).controls) {
        const answerOption = answerOptionContorl.value;
        if (answerOption.id === condition.condition_target_answer_option) {
          return answerOption;
        }
      }
    }
    return null;
  }

  private calculateProgress(): number {
    let totalAnswersCount = 0;
    let answersCompletedCount = 0;

    for (const questionControl of (this.myForm.get('questions') as FormArray)
      .controls) {
      const question: QuestionFormValue = questionControl.value;
      if (
        !question.condition ||
        this.isConditionMet(
          this.getConditionTargetAnswer(question.condition),
          question.condition
        )
      ) {
        for (const answerOptionControl of (
          questionControl.get('answer_options') as FormArray
        ).controls) {
          const answerOption: AnswerOptionFormValue = answerOptionControl.value;
          if (this.isConditionOfElementFulfilled(answerOption)) {
            totalAnswersCount += 1;
            if (
              answerOptionControl &&
              !!answerOption.value &&
              answerOptionControl.valid
            ) {
              answersCompletedCount += 1;
            }
          }
        }
      }
    }
    return Math.round((answersCompletedCount / totalAnswersCount) * 100);
  }

  /**
   * Sends all answers to the backend and updates the QI except when the answers are released
   * @param isRelease if the answers are going to be released
   */
  private async postAllAnswers(isRelease: boolean): Promise<void> {
    const answers = [];
    const questions = this.myForm.get('questions').value as QuestionFormValue[];
    for (const question of questions) {
      question.answer_options.forEach((answerOption) => {
        answers.push(this.formatAnswerOption(answerOption));
      });
    }

    const request = {
      answers,
      version: Tools.getAnswerVersion(
        this.questionnaire_instance_status,
        this.answerVersionFromServer,
        this.release_version
      ),
      date_of_release: new Date(),
    };

    if (isRelease && this.user.hasRole('Untersuchungsteam')) {
      request.date_of_release = new Date();
    }

    try {
      const result = await this.questionnaireService.postAnswers(
        this.questionnaireInstanceId,
        request
      );

      if (result.answers) {
        this.answerVersionFromServer = result.answers[0]
          ? result.answers[0].versioning
          : this.answerVersionFromServer;
        this.answerIdsFromServer = result.answers.map(
          (answer) => answer.answer_option_id
        );
      }

      this.myForm.markAsPristine();
      if (!isRelease) {
        if (this.questionnaire_instance_status === 'active') {
          const res = await this.questionnaireService.putQuestionnaireInstance(
            this.questionnaireInstanceId,
            {
              status: 'in_progress',
              progress: this.calculateProgress(),
              release_version: this.release_version,
            }
          );
          this.questionnaire_instance_status = res.status;
        } else {
          await this.questionnaireService.putQuestionnaireInstance(
            this.questionnaireInstanceId,
            { progress: this.calculateProgress() }
          );
        }
      }
    } catch (err) {
      console.log(err);
      if (
        err.error.statusCode === 400 &&
        err.error.message.includes(
          'answer value should have a maximum length of'
        )
      ) {
        this.alertService.errorMessage(
          this.translate.instant('ANSWERS_PROBAND.UPLOADED_FILE_TOO_LARGE')
        );
      } else {
        this.alertService.errorObject(err);
      }
    }
  }

  private findAndOpenNextInstance(): void {
    this.questionnaireService
      .getQuestionnaireInstanceQueues(this.pseudonym)
      .then(async (queuesResult: QuestionnaireInstanceQueue[]) => {
        if (queuesResult.length < 1) {
          timeout(300);
          queuesResult =
            await this.questionnaireService.getQuestionnaireInstanceQueues(
              this.pseudonym
            );
        }
        if (queuesResult.length < 1) {
          this.router.navigate(['questionnaires/user']);
        } else {
          let foundInstance = null;
          for (let i = 0; !foundInstance && i < queuesResult.length; i++) {
            try {
              const instance =
                await this.questionnaireService.getQuestionnaireInstance(
                  queuesResult[i].questionnaire_instance_id
                );
              if (
                instance &&
                (instance.status === 'active' ||
                  instance.status === 'in_progress')
              ) {
                foundInstance = instance;
                await this.questionnaireService.deleteQuestionnaireInstanceQueue(
                  queuesResult[i].questionnaire_instance_id,
                  this.pseudonym
                );
              } else if (
                instance &&
                (instance.status === 'released_once' ||
                  instance.status === 'released_twice' ||
                  instance.status === 'expired')
              ) {
                await this.questionnaireService.deleteQuestionnaireInstanceQueue(
                  queuesResult[i].questionnaire_instance_id,
                  this.pseudonym
                );
              }
            } catch (e) {
              console.log('queued instance is not available, trying next one');
            }
          }
          if (foundInstance) {
            this.router.navigate(['questionnaires/user']).then(() => {
              this.router.navigate([
                '/questionnaire/',
                foundInstance.questionnaire.id,
                foundInstance.id,
              ]);
            });
          } else {
            this.router.navigate(['questionnaires/user']);
          }
        }
      });
  }

  private validateSampleID(
    control: AbstractControl
  ): { sampleWrongFormat: boolean } | null {
    const regexp = new RegExp(
      (this.studyOfQuestionnaire.sample_prefix
        ? '^' + this.studyOfQuestionnaire.sample_prefix + '-'
        : '.*') +
        (this.studyOfQuestionnaire.sample_suffix_length
          ? '[0-9]{' + this.studyOfQuestionnaire.sample_suffix_length + '}$'
          : '[0-9]*$'),
      'i'
    );
    if (control.value && !regexp.test(control.value)) {
      return { sampleWrongFormat: true };
    } else {
      return null;
    }
  }

  public onSendSampleIdClicked(answerOption: FormGroup): void {
    let sampleId = '';
    let dummySampleId = '';

    if (
      !answerOption.get('sample_id_1').errors &&
      (!this.studyOfQuestionnaire.has_rna_samples ||
        !answerOption.get('sample_id_2').errors)
    ) {
      if (this.studyOfQuestionnaire.has_rna_samples) {
        if (
          answerOption
            .get('sample_id_1')
            .value.charAt(
              this.studyOfQuestionnaire.sample_prefix.length +
                1 +
                (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
            ) === '0' &&
          answerOption
            .get('sample_id_2')
            .value.charAt(
              this.studyOfQuestionnaire.sample_prefix.length +
                1 +
                (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
            ) === '1'
        ) {
          sampleId = answerOption.get('sample_id_1').value;
          dummySampleId = answerOption.get('sample_id_2').value;
        } else if (
          answerOption
            .get('sample_id_1')
            .value.charAt(
              this.studyOfQuestionnaire.sample_prefix.length +
                1 +
                (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
            ) === '1' &&
          answerOption
            .get('sample_id_2')
            .value.charAt(
              this.studyOfQuestionnaire.sample_prefix.length +
                1 +
                (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
            ) === '0'
        ) {
          sampleId = answerOption.get('sample_id_2').value;
          dummySampleId = answerOption.get('sample_id_1').value;
        } else {
          answerOption.setErrors({ wrong_format: true });
        }
      } else {
        // Do not check for 0 or 1 if we only have one sample
        sampleId = answerOption.get('sample_id_1').value;
      }

      if (
        sampleId !== '' &&
        (!this.studyOfQuestionnaire.has_rna_samples || dummySampleId !== '')
      ) {
        this.sampleTrackingService
          .updateSampleStatusAndSampleDateFor(
            sampleId,
            dummySampleId,
            this.pseudonym
          )
          .then(() => {
            // Show success message
            this.dialog.open(DialogPopUpComponent, {
              width: '350px',
              data: {
                content: 'QUESTION_PROBAND.SCANNING_SUCCESS',
                icon: 'done',
                isSuccess: true,
              },
            });

            // Disable Button and make input field uneditable
            answerOption.get('hasValue').setValue(true);
            this.postAllAnswers(false);
          })
          .catch((err: HttpErrorResponse) => {
            if (
              err.error.message ===
              'Dummy_sample_id does not match the one in the database'
            ) {
              // set error on dummy_sample_id
              answerOption
                .get('sample_id_1')
                .value.charAt(
                  this.studyOfQuestionnaire.sample_prefix.length +
                    1 +
                    (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
                ) === '1' || !this.studyOfQuestionnaire.has_rna_samples
                ? answerOption.get('sample_id_1').setErrors({
                    not_exist: true,
                  })
                : answerOption.get('sample_id_2').setErrors({
                    not_exist: true,
                  });
            } else if (err.error.message === 'Labresult does not exist') {
              // set error on sample_id
              answerOption
                .get('sample_id_1')
                .value.charAt(
                  this.studyOfQuestionnaire.sample_prefix.length +
                    1 +
                    (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
                ) === '0' || !this.studyOfQuestionnaire.has_rna_samples
                ? answerOption.get('sample_id_1').setErrors({
                    not_exist: true,
                  })
                : answerOption.get('sample_id_2').setErrors({
                    not_exist: true,
                  });
            } else if (
              err.error.message ===
              'Sample_id does not belong to Proband or it does not exist in db or update params are missing'
            ) {
              answerOption.get('sample_id_1').setErrors({
                already_scanned: true,
              });
              if (this.studyOfQuestionnaire.has_rna_samples) {
                answerOption.get('sample_id_2').setErrors({
                  already_scanned: true,
                });
              }
            }
            this.dialog.open(DialogPopUpComponent, {
              width: '350px',
              data: {
                content: 'QUESTION_PROBAND.SCANNING_WRONG',
                icon: 'priority_high',
                isSuccess: false,
              },
            });
          });
      }
    }
  }

  public updateState(
    button: MatRadioButton,
    questionIndex: number,
    answerIndex: number
  ): void {
    const answerValue = this.getAnswerOptionFormControlAtPosition(
      questionIndex,
      answerIndex
    ).get('value');
    if (button.checked) {
      answerValue.setValue('');
    } else {
      answerValue.setValue(button.value);
    }
    this.checkConditions(questionIndex, answerIndex);
  }

  public isAnswerInArray(answer, answers_string): boolean {
    const answers = answers_string.split(';');
    const foundAnswer = answers.find((item) => {
      return item === answer.value;
    });
    return !!foundAnswer;
  }

  private isConditionMet(
    answer: AnswerOptionFormValue,
    condition: ConditionFormValue
  ): boolean {
    const targetAnswerType = answer.answer_type_id;

    let answerValues = [];
    let conditionValues: (Date | string | number)[];
    if (targetAnswerType === AnswerType.Number) {
      answerValues = answer.value
        .toString()
        .split(';')
        .map((value) => {
          return parseFloat(value);
        });
      conditionValues = condition.condition_value
        .toString()
        .split(';')
        .map((value) => {
          return parseFloat(value);
        });
    } else if (targetAnswerType === AnswerType.Date) {
      answerValues = answer.value
        .toString()
        .split(';')
        .map((answerValue) => {
          return answerValue ? new Date(answerValue) : '';
        });
      conditionValues = condition.condition_value
        .toString()
        .split(';')
        .map((conditionValue) => {
          return conditionValue ? new Date(conditionValue) : '';
        });
    } else {
      answerValues = answer.value.toString().split(';');
      conditionValues = condition.condition_value.toString().split(';');
    }

    const conditionLink = condition.condition_link
      ? condition.condition_link
      : 'OR';

    switch (condition.condition_operand) {
      case '<':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value < conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value < conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value < conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '>':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value > conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value > conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value > conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '<=':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value <= conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value <= conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value <= conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '>=':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== '' ? value >= conditionValue : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value >= conditionValue : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== '' ? value >= conditionValue : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '==':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? value.equals(conditionValue)
                  : value === conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? value.equals(conditionValue)
                  : value === conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? value.equals(conditionValue)
                  : value === conditionValue
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '\\=':
        if (conditionLink === 'AND') {
          return conditionValues.every((conditionValue) => {
            if (conditionValue === '') {
              return true;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? !value.equals(conditionValue)
                  : value !== conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'OR') {
          return conditionValues.some((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? !value.equals(conditionValue)
                  : value !== conditionValue
                : false;
            });
          });
        } else if (conditionLink === 'XOR') {
          const count = conditionValues.filter((conditionValue) => {
            if (conditionValue === '') {
              return false;
            }
            return answerValues.some((value) => {
              return value !== ''
                ? targetAnswerType === 5
                  ? !value.equals(conditionValue)
                  : value !== conditionValue
                : false;
            });
          }).length;
          return count === 1;
        }
        break;
    }
    return false;
  }

  private goToSlide(slideNumber: number): void {
    this.questionSwiper.swiper.slideTo(slideNumber);
  }

  private goToNextSlide(): void {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    const lastIndex = this.questionSwiper.swiper.slides.length - 1;

    const questionControl = this.myForm.get('questions') as FormArray;

    if (questionIndex === lastIndex) {
      this.goToAnswersView(false);
    } else {
      for (let i = questionIndex; i < lastIndex + 1; i++) {
        if (i === lastIndex) {
          this.goToAnswersView(false);
          break;
        }
        const nextQuestionIsShown =
          (questionControl.at(i + 1) as FormGroup).get('show_question')
            .value === true &&
          (questionControl.at(i + 1) as FormGroup).get(
            'show_question_answer_condition'
          ).value === true;
        if (nextQuestionIsShown) {
          this.goToSlide(i);
          break;
        }
      }
    }
  }

  public updateAnswerTypeValue(result: {
    dataAsUrl: string;
    answer_option_id: number;
    answerOptionIndex: number;
    file_name: string;
  }): void {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    const answerValue = this.getAnswerOptionFormControlAtPosition(
      questionIndex,
      result.answerOptionIndex
    ).get('value');

    const value =
      result.dataAsUrl !== ''
        ? JSON.stringify({
            file_name: result.file_name,
            data: result.dataAsUrl,
          })
        : '';
    answerValue.setValue(value);
  }

  public backClicked(): void {
    this._location.back();
  }

  public setAnswerTypeValue(answer, $event, i, j): void {
    answer.get('value').value = $event;
    const answerValue = this.getAnswerOptionFormControlAtPosition(i, j).get(
      'value'
    );
    answerValue.setValue($event);
  }

  public getAnswerVersion(
    questionnaire_instance_status: string,
    answerVersionFromServer: number,
    release_version: number
  ): string | undefined {
    let version;
    switch (questionnaire_instance_status) {
      case 'active':
      case 'in_progress':
        version = answerVersionFromServer !== 0 ? answerVersionFromServer : 1;
        break;
      case 'released_once':
      case 'released':
        if (release_version === answerVersionFromServer) {
          version = answerVersionFromServer + 1;
        } else {
          version = answerVersionFromServer !== 0 ? answerVersionFromServer : 1;
        }
        break;
      default:
        break;
    }
    return version;
  }
}
