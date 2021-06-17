import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Observable } from 'rxjs';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { SampleTrackingService } from 'src/app/psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import {
  Condition,
  Questionnaire,
} from '../../../psa.app.core/models/questionnaire';
import { Question } from '../../../psa.app.core/models/question';
import { AlertService } from '../../../_services/alert.service';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
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
import 'datejs';
import { Location } from '@angular/common';
import { User } from '../../../psa.app.core/models/user';
import { JwtHelperService } from '@auth0/angular-jwt';
import { timeout } from 'rxjs/internal/operators/timeout';
import { Tools } from './tools';
import {
  HistoryItem,
  QuestionItem,
} from 'src/app/psa.app.core/models/historyItem';
import { Studie } from 'src/app/psa.app.core/models/studie';
import { RequiredAnswerValidator } from './required-answer-validator';
import { HttpErrorResponse } from '@angular/common/http';
import { SelectedProbandInfoService } from '../../../_services/selected-proband-info.service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';

enum DisplayStatus {
  QUESTIONS,
  OVERVIEW,
  HISTORY,
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
  public questionnaireId: any;
  public questionnaireInstanceId: any;
  questionnaire: Questionnaire;
  studyOfQuestionnaire: Studie = null;
  answer_type_id: number;
  public answer_value: any;
  public answers: Answer[] = [];
  public questions: Question[];
  @ViewChild('questionSwiper') questionSwiper: SwiperComponent;
  DisplayStatus = DisplayStatus;
  public displayStatus: DisplayStatus = DisplayStatus.QUESTIONS;
  currentHistory: HistoryItem[] = [];
  questionnaire_instance_status: string;
  date_of_issue: Date;
  isLoading: boolean = false;
  progress: number;
  allInternalConditionsInQuestionnaire: Condition[] = [];
  answerIdsFromServer: number[] = [];
  config: SwiperOptions = {
    pagination: { el: '.swiper-pagination', clickable: false },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
      disabledClass: 'swiper-navigation-disabled',
    },
    simulateTouch: false,
    spaceBetween: 30,
  };
  currentRole: string;
  user_id: string;
  answerVersionFromServer: number;
  release_version: number;
  tools: Tools;
  proband: User;

  canDeactivate(): Observable<boolean> | boolean {
    return this.myForm ? !this.myForm.dirty : true;
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.canDeactivate()) {
      // This message is displayed to the user in IE and Edge when they navigate without using Angular routing (type another URL/close the browser/etc)
      $event.returnValue = this.translate.instant('WARNING.ANSWERS');
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private router: Router,
    private translate: TranslateService,
    private userService: AuthService,
    private selectedProbandInfoService: SelectedProbandInfoService,
    private questionnaireService: QuestionnaireService,
    private sampleTrackingService: SampleTrackingService,
    public dialog: MatDialog,
    private _location: Location
  ) {
    this.tools = new Tools();
    const jwtHelper: JwtHelperService = new JwtHelperService();
    const currentUser: User = JSON.parse(localStorage.getItem('currentUser'));
    // decode the token to get its payload
    const tokenPayload = jwtHelper.decodeToken(currentUser.token);
    this.currentRole = tokenPayload.role;
    if ('id' in this.activatedRoute.snapshot.params) {
      this.questionnaireId = this.activatedRoute.snapshot.paramMap.get('id');
      this.questionnaireInstanceId =
        this.activatedRoute.snapshot.paramMap.get('instanceId');
    }
  }

  ngOnInit(): void {
    this.isLoading = true;

    this.questionnaireService
      .getQuestionnaireInstance(this.questionnaireInstanceId)
      .then(
        async (result: any) => {
          this.questionnaire_instance_status = result.status
            ? result.status
            : 'active';
          this.date_of_issue = result.date_of_issue;
          this.user_id = result.user_id;
          this.release_version = result.release_version;
          this.questionnaire = result.questionnaire;

          // get study for sample configuration
          this.studyOfQuestionnaire = await this.questionnaireService.getStudy(
            this.questionnaire.study_id
          );

          if (this.currentRole === 'Untersuchungsteam') {
            this.proband = await this.userService.getUser(this.user_id);
            this.selectedProbandInfoService.updateSideNavInfoSelectedProband({
              ids: this.proband['ids'],
              pseudonym: this.proband['username'],
            });
          }
          await this.initForm(this.questionnaire); // handles both the create and edit logic
          this.isLoading = false;
        },
        (err: any) => {
          this.alertService.errorObject(err);
        }
      );
  }

  ngOnDestroy(): void {
    if (this.currentRole === 'Untersuchungsteam') {
      this.selectedProbandInfoService.updateSideNavInfoSelectedProband(null);
    }
  }

  /**
   * Initialises the myForm
   * @method initForm
   */
  async initForm(questionnaire?: Questionnaire): Promise<void> {
    const questions: FormArray = new FormArray([]);
    const name = this.questionnaire.name;
    this.myForm = new FormGroup({
      name: new FormControl(name),
      questions,
    });
    const result: any = await this.questionnaireService.getAnswers(
      this.questionnaireInstanceId
    );
    this.answers = result.answers;
    this.answerVersionFromServer = this.answers[0]
      ? this.answers[0].versioning
      : 0;

    questionnaire.questions.forEach((question, questionIndex) => {
      this.addQuestion(question);
      question.answer_options.forEach((answerOption, answerOptionIndex) => {
        const valueList: Value[] = [];
        if (this.answers.length !== 0) {
          this.answers.forEach((answer) => {
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
  addQuestion(question?: Question): void {
    const text = question ? this.calculatAppropriateDate(question.text) : '';
    const is_mandatory =
      question && question.is_mandatory ? question.is_mandatory : false;
    const answer_options = new FormArray([]);
    const id = question ? question.id : '';
    const questionIndex = (this.myForm.controls['questions'] as FormArray)
      .length;

    (this.myForm.controls['questions'] as FormArray).push(
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
        answer_options,
      })
    );
    if (
      question.condition &&
      question.condition.condition_type === 'internal_this'
    ) {
      this.allInternalConditionsInQuestionnaire.push(question.condition);
      this.addQuestionCondition(questionIndex, question);
    }
  }

  /**
   * Replace the value in days with a date
   *
   * @param inputText input string for convert vaues to dates
   */
  calculatAppropriateDate(inputText: string): string {
    const myRegex = /\(dat=(.*?)\)/g;
    let str = inputText ? inputText : '';
    while (true) {
      const myArray = myRegex.exec(str);
      if (!myArray) {
        break;
      }
      const days = Number.parseInt(myArray[1], 10);
      const date = new Date(this.date_of_issue);
      const replacementDate = date.addDays(days);
      str = str.replace(myArray[0], replacementDate.toString('dd.MM.yy'));
    }
    return str;
  }

  addQuestionCondition(questionIndex: number, question?: Question): void {
    const questionControl = (this.myForm.controls['questions'] as FormArray)
      .controls[questionIndex] as FormGroup;
    const condition_type =
      question && question.condition ? question.condition.condition_type : null;
    const condition_questionnaire_id =
      question && question.condition
        ? question.condition.condition_target_questionnaire
        : null;
    const condition_answer_option_id =
      question && question.condition
        ? question.condition.condition_target_answer_option
        : null;
    const condition_operand =
      question && question.condition
        ? question.condition.condition_operand
        : null;
    const condition_value =
      question && question.condition
        ? question.condition.condition_value
        : null;
    const condition_question_id = undefined;

    questionControl.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(condition_type),
        condition_target_questionnaire: new FormControl(
          condition_questionnaire_id
        ),
        condition_target_answer_option: new FormControl(
          condition_answer_option_id
        ),
        condition_question_id: new FormControl(condition_question_id),
        condition_operand: new FormControl(condition_operand),
        condition_value: new FormControl(condition_value),
      })
    );
  }

  /**
   * Adds a AnswerOption FormGroup to the question's <FormArray>FormControl(answer)
   */
  addAnswer(questionIndex: number, answerOption?: AnswerOption): void {
    const text = answerOption
      ? this.calculatAppropriateDate(answerOption.text)
      : '';
    this.answer_type_id = answerOption ? answerOption.answer_type_id : null;
    const answer_id = answerOption ? answerOption.id : '';
    const question_id = answerOption ? answerOption.question_id : '';
    const is_condition_target = answerOption
      ? answerOption.is_condition_target
      : '';
    let hasValue = false;

    if (answerOption) {
      this.answer_value = answerOption.answer_value
        ? answerOption.answer_value
        : '';
      if (this.answer_value !== '' && this.answer_type_id === 5) {
        this.answer_value = new Date(this.answer_value);
      }
      if (this.answer_type_id === 6) {
        hasValue = !!this.answer_value;
      }
    } else {
      this.answer_value = '';
    }

    const answerOptions: FormArray = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormArray
    ).controls['answer_options'];

    answerOptions.push(
      new FormGroup({
        text: new FormControl(text),
        id: new FormControl(answer_id),
        question_id: new FormControl(question_id),
        answer_type_id: new FormControl(this.answer_type_id),
        show_answer_option: new FormControl(
          !(
            answerOption &&
            answerOption.condition &&
            answerOption.condition.condition_type === 'internal_this'
          )
        ),
        is_condition_target: new FormControl(is_condition_target),
        value: new FormControl(this.answer_value),
        values: new FormArray([]),
        hasValue: new FormControl(hasValue),
      })
    );

    const answerIndex = answerOptions.length - 1;
    const answerControl: FormGroup = answerOptions.controls[
      answerIndex
    ] as FormGroup;
    const is_mandatory = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['is_mandatory'] as FormControl
    ).value;

    if (is_mandatory) {
      answerControl.setValidators(RequiredAnswerValidator.answerRequired);
    }

    if (this.answer_type_id === 3) {
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
        answerControl.setValidators(this.checkValueRanges);
      }
      answerControl.addControl(
        'is_decimal',
        new FormControl(answerOption.is_decimal)
      );
      if (answerOption.is_decimal) {
        answerControl.get('value').setValidators(this.checkIfNumberIsDecimal);
      } else {
        answerControl.get('value').setValidators(this.checkIfNumberIsInteger);
      }
    }

    if (this.answer_type_id === 6) {
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

    if (this.answer_type_id === 5) {
      const restriction_min =
        answerOption.restriction_min !== null
          ? this.countDateFromToday(answerOption.restriction_min)
          : null;
      const restriction_max =
        answerOption.restriction_max !== null
          ? this.countDateFromToday(answerOption.restriction_max)
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
        answerControl.setValidators(this.checkValueRanges);
      }
    }

    if (
      answerOption.condition &&
      answerOption.condition.condition_type === 'internal_this'
    ) {
      this.allInternalConditionsInQuestionnaire.push(answerOption.condition);
      this.addAnswerCondition(questionIndex, answerIndex, answerOption);
    }
    answerControl.updateValueAndValidity();
  }

  countDateFromToday(days: number): Date {
    return new Date(Date.today().addDays(days).getTime());
  }

  checkIfNumberIsDecimal(control: FormControl): ValidationErrors {
    const formControlText = control.value;
    if (
      formControlText &&
      formControlText.toString().match(/^-?(0|[1-9]\d*)([\.\,]\d+)?$/) === null
    ) {
      return { notDecimalNumber: true };
    } else {
      return null;
    }
  }

  checkIfNumberIsInteger(control: FormControl): ValidationErrors {
    const formControlText = control.value;
    if (
      formControlText &&
      formControlText.toString().match(/^([+-]?[1-9]\d*|0)$/) === null
    ) {
      return { notNumber: true };
    } else {
      return null;
    }
  }

  checkValueRanges(AC: AbstractControl): { valuesValidate: boolean } {
    const formControlText = AC.get('value').value
      ? AC.get('answer_type_id').value === 3
        ? parseFloat(AC.get('value').value)
        : AC.get('value').value
      : null;
    const restriction_min = AC.get('restriction_min').value;
    const restriction_max = AC.get('restriction_max').value;

    if (
      formControlText === null ||
      formControlText === undefined ||
      formControlText === ''
    ) {
      return null;
    } else {
      if (
        !Number.isNaN(formControlText) &&
        !Number.isNaN(restriction_min) &&
        !Number.isNaN(restriction_max) &&
        restriction_min <= formControlText &&
        formControlText <= restriction_max
      ) {
        return null;
      } else {
        AC.get('value').setErrors({ valuesValidate: true });
        return { valuesValidate: true };
      }
    }
  }

  /**
   * Check that the values inside (dat=) are only numbers
   *
   * @param control form control
   */
  validateFormControlTextVariableValue(control: FormControl): ValidationErrors {
    const formControlText = control.value;
    const myRegex = /\(dat=(.*?)\)/g;
    const str = control.value ? control.value : '';
    const counter = 0;
    while (true) {
      const myArray = myRegex.exec(str);
      if (myArray === null) {
        break;
      }
      if (myArray[1] === '' || myArray[1].match(/^-?[0-9,]*$/) === null) {
        return { validVariable: true };
      }
    }
    return null;
  }

  addAnswerCondition(
    questionIndex: number,
    answerIndex: number,
    answerOption?: AnswerOption
  ): void {
    const answerControl = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).controls[answerIndex] as FormGroup;

    const condition_type = answerOption
      ? answerOption.condition.condition_type
      : null;
    const condition_questionnaire_id = answerOption
      ? answerOption.condition.condition_target_questionnaire
      : null;
    const condition_answer_option_id = answerOption
      ? answerOption.condition.condition_target_answer_option
      : null;
    const condition_operand = answerOption
      ? answerOption.condition.condition_operand
      : null;
    const condition_value = answerOption
      ? answerOption.condition.condition_value
      : null;
    const condition_question_id = undefined;

    answerControl.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(condition_type),
        condition_target_questionnaire: new FormControl(
          condition_questionnaire_id
        ),
        condition_target_answer_option: new FormControl(
          condition_answer_option_id
        ),
        condition_question_id: new FormControl(condition_question_id),
        condition_operand: new FormControl(condition_operand),
        condition_value: new FormControl(condition_value),
      })
    );
  }

  addValue(
    questionIndex: number,
    answerIndex: number,
    value?: string,
    valueList?: Value
  ): void {
    let text: any;
    if (value) {
      if (
        (
          (
            (
              (
                (this.myForm.controls['questions'] as FormArray).controls[
                  questionIndex
                ] as FormGroup
              ).controls['answer_options'] as FormArray
            ).controls[answerIndex] as FormGroup
          ).controls['answer_type_id'] as FormControl
        ).value === '5'
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
      (
        (
          (
            (this.myForm.controls['questions'] as FormArray).controls[
              questionIndex
            ] as FormGroup
          ).controls['answer_options'] as FormArray
        ).controls[answerIndex] as FormGroup
      ).controls['values'] as FormArray
    ).push(
      new FormGroup({
        value: new FormControl(text),
        isChecked: new FormControl(isChecked),
      })
    );
  }

  onChange(
    input: HTMLInputElement,
    questionIndex: number,
    answerIndex: number
  ): void {
    const answerValue = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).get('value') as FormControl as FormControl;
    const answerValues =
      (
        (
          (
            (
              (this.myForm.controls['questions'] as FormArray).controls[
                questionIndex
              ] as FormGroup
            ).controls['answer_options'] as FormArray
          ).controls[answerIndex] as FormGroup
        ).controls['values'] as FormArray
      ).value != null
        ? (
            (
              (
                (
                  (this.myForm.controls['questions'] as FormArray).controls[
                    questionIndex
                  ] as FormGroup
                ).controls['answer_options'] as FormArray
              ).controls[answerIndex] as FormGroup
            ).controls['values'] as FormArray
          ).value
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

  goToAnswersView(sendAnswers: boolean): void {
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
      const x = document.getElementById('questionSwiper');
      x.style.display = 'none';
    }
  }

  async goToHistoryView(): Promise<void> {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    if (this.shouldLockActualSwipe(questionIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    } else {
      await this.postAllAnswers(false);
      await this.buildCurrentHistory();
      this.displayStatus = DisplayStatus.HISTORY;
      const x = document.getElementById('questionSwiper');
      x.style.display = 'none';
    }
  }

  async buildCurrentHistory(): Promise<void> {
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
          value_old: this.presentAnswerValue(
            lastAnswer.value,
            subquestion as any
          ),
          value_new: this.presentAnswerValue(answer.value, subquestion as any),
        });
        if (
          new Date(lastAnswer.date_of_release).compareTo(
            new Date(newHistoryItem.date_of_release_old)
          ) > 0
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

  presentAnswerValue(value: string, subquestion: AnswerOption): string {
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
        result = new Date(value).toString('dd.MM.yyyy');
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
        result = new Date(Number(value)).toString('dd.MM.yyyy - HH:mm:ss');
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

  getLastAnswer(id, curVersioning, histAnswers): Partial<Answer> {
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

  getQuestionFromID(id): Question {
    return this.questionnaire.questions.find((question: Question) => {
      return question.id === id;
    });
  }

  getSubquestionFromID(id): Question {
    let foundSubQuestion = null;
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

  onClickQuestion(questionIndex: number): void {
    const questionActiveIndex = this.questionSwiper.swiper.activeIndex;
    this.questionSwiper.swiper.allowSlidePrev = true;
    this.questionSwiper.swiper.allowSlideNext = true;

    if (this.shouldLockActualSwipe(questionActiveIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionActiveIndex)[1]);
    } else {
      this.postAllAnswers(false);
      this.displayStatus = DisplayStatus.QUESTIONS;
      const x = document.getElementById('questionSwiper');
      x.style.display = 'block';
      this.questionSwiper.swiper.slideTo(questionIndex);
    }
  }

  onSwipeNext(): void {
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

  onSwipePrev(): void {
    if (this.isLoading) {
      return;
    }
    const questionIndex = this.questionSwiper.swiper.activeIndex;

    this.questionSwiper.swiper.allowSlidePrev = true;
    this.questionSwiper.swiper.allowSlideNext = true;

    const questionControl = this.myForm.controls['questions'] as FormArray;
    if (this.shouldLockActualSwipe(questionIndex)[0]) {
      this.questionSwiper.swiper.allowSlidePrev = false;
      this.questionSwiper.swiper.allowSlideNext = false;
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    } else {
      this.postAllAnswers(false);
      for (let i = questionIndex; i >= 0; i--) {
        if (questionControl.controls[i - 1] as FormGroup) {
          if (
            (questionControl.controls[i - 1] as FormGroup).controls[
              'show_question'
            ].value === true &&
            (questionControl.controls[i - 1] as FormGroup).controls[
              'show_question_answer_condition'
            ].value === true
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

  showLockWarning(message: string): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '350px',
      data: { content: message, isSuccess: false },
    });
  }

  shouldLockActualSwipe(actualSwipeIndex): any[] {
    let actualSwipeShouldBeLocked = false;
    let message = 'ANSWERS_PROBAND.CURRENT_QUESTION';
    const response = [];
    const questions = this.myForm.controls['questions'] as FormArray;
    const actualQuestionIsMandatory = (
      questions.controls[actualSwipeIndex] as FormGroup
    ).controls['is_mandatory'].value;
    const answerOptionsControl = (
      questions.controls[actualSwipeIndex] as FormGroup
    ).controls['answer_options'] as FormArray;

    // check if there any answer options that are shown but not answered
    for (let i = 0; i < answerOptionsControl.length; i++) {
      const hasError =
        (answerOptionsControl.controls[i] as FormGroup).controls[
          'value'
        ].hasError('valuesValidate') ||
        (answerOptionsControl.controls[i] as FormGroup).controls[
          'value'
        ].hasError('notDecimalNumber') ||
        (answerOptionsControl.controls[i] as FormGroup).controls[
          'value'
        ].hasError('notNumber');
      const isNotAnswered =
        (answerOptionsControl.controls[i] as FormGroup).controls['value']
          .value === '';
      const isShown = (answerOptionsControl.controls[i] as FormGroup).controls[
        'show_answer_option'
      ].value;

      if (
        (answerOptionsControl.controls[i] as FormGroup).controls[
          'answer_type_id'
        ].value === 6 &&
        ((answerOptionsControl.controls[i] as FormGroup).controls['sample_id_1']
          .value ||
          (this.studyOfQuestionnaire.has_rna_samples &&
            (answerOptionsControl.controls[i] as FormGroup).controls[
              'sample_id_2'
            ].value)) &&
        !(answerOptionsControl.controls[i] as FormGroup).controls['hasValue']
          .value
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
          (answerOptionsControl.controls[i] as FormGroup).controls[
            'answer_type_id'
          ].value === 6 &&
          !(answerOptionsControl.controls[i] as FormGroup).controls['hasValue']
            .value
        ) {
          actualSwipeShouldBeLocked = true;
          message = 'ANSWERS_PROBAND.CURRENT_SAMPLE_IDs';
          break;
        } else if (
          (answerOptionsControl.controls[i] as FormGroup).controls[
            'answer_type_id'
          ].value !== 6 &&
          isNotAnswered
        ) {
          actualSwipeShouldBeLocked = true;
          break;
        }
      }
    }
    response.push(actualSwipeShouldBeLocked);
    response.push(message);
    return response;
  }

  checkConditions(questionIndex: number, answerIndex: number): void {
    const questionControl = this.myForm.get('questions') as FormArray;
    // answerOptions control for current question
    const answerControlActiveQuestion = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormControl
    ).value;
    // answerControlActiveQuestion.updateValueAndValidity();
    const questionAndAnswerIndexesToCheckConditionAgain = [];
    questionControl.getRawValue().forEach((question, questionIndexFromList) => {
      const singleQuestionControl = questionControl.controls[
        questionIndexFromList
      ] as FormGroup;
      if (
        question.condition &&
        question.condition.condition_type === 'internal_this' &&
        question.condition.condition_target_answer_option ===
          answerControlActiveQuestion.id
      ) {
        let conditionMatches = false;
        if (answerControlActiveQuestion.value != null) {
          conditionMatches = this.isConditionMet(
            answerControlActiveQuestion,
            question.condition
          );
        }
        if (!conditionMatches) {
          (
            singleQuestionControl.controls['show_question'] as FormControl
          ).setValue(false);
          const answerOptionsControl = (
            (this.myForm.controls['questions'] as FormArray).controls[
              questionIndexFromList
            ] as FormGroup
          ).controls['answer_options'] as FormArray;
          for (let i = 0; i < answerOptionsControl.length; i++) {
            const answerOptionID = (
              answerOptionsControl.controls[i] as FormGroup
            ).controls['id'].value;
            // delete answers if exist on server
            if (
              (answerOptionsControl.controls[i] as FormGroup).controls[
                'answer_type_id'
              ].value !== 6
            ) {
              (answerOptionsControl.controls[i] as FormGroup).controls[
                'value'
              ].setValue('');
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
            const answerCheckboxValues = (
              (
                (
                  (this.myForm.controls['questions'] as FormArray).controls[
                    questionIndexFromList
                  ] as FormGroup
                ).controls['answer_options'] as FormArray
              ).controls[i] as FormGroup
            ).controls['values'] as FormArray;
            if (
              answerCheckboxValues &&
              (answerOptionsControl.controls[i] as FormGroup).controls[
                'answer_type_id'
              ].value === 2
            ) {
              answerCheckboxValues.value.forEach(
                (answerCheckboxValue, answerCheckboxValueIndex) => {
                  (
                    answerCheckboxValues.controls[
                      answerCheckboxValueIndex
                    ] as FormGroup
                  ).controls['isChecked'].setValue(false);
                }
              );
            }

            if (
              (answerOptionsControl.controls[i] as FormGroup).controls[
                'is_condition_target'
              ].value
            ) {
              questionAndAnswerIndexesToCheckConditionAgain.push({
                questionIndex: questionIndexFromList,
                answerIndex: i,
              });
            }
          }
          singleQuestionControl.disable();
        } else {
          (
            singleQuestionControl.controls['show_question'] as FormControl
          ).setValue(true);
          singleQuestionControl.enable();
        }
      }

      const answers = async () => {
        if (question.answer_options) {
          question.answer_options.forEach(
            async (answerOption, answerOptionIndex) => {
              // answerOptions control for question from list
              const answerOptionControl = (
                (
                  (this.myForm.controls['questions'] as FormArray).controls[
                    questionIndexFromList
                  ] as FormGroup
                ).controls['answer_options'] as FormArray
              ).controls[answerOptionIndex] as FormGroup;
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
                  (
                    answerOptionControl.controls[
                      'show_answer_option'
                    ] as FormControl
                  ).setValue(false);
                  (
                    answerOptionControl.controls['value'] as FormControl
                  ).setValue('');
                  // delete answers if exist on server
                  if (
                    answerOptionControl.controls['answer_type_id'].value !== 6
                  ) {
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
                  const answerCheckboxValues = (
                    (
                      (
                        (this.myForm.controls['questions'] as FormArray)
                          .controls[questionIndexFromList] as FormGroup
                      ).controls['answer_options'] as FormArray
                    ).controls[answerOptionIndex] as FormGroup
                  ).controls['values'] as FormArray;
                  if (
                    answerCheckboxValues &&
                    answerOptionControl.controls['answer_type_id'].value === 2
                  ) {
                    answerCheckboxValues.value.forEach(
                      (answerCheckboxValue, answerCheckboxValueIndex) => {
                        (
                          answerCheckboxValues.controls[
                            answerCheckboxValueIndex
                          ] as FormGroup
                        ).controls['isChecked'].setValue(false);
                      }
                    );
                  }
                  answerOptionControl.disable();
                  if (!singleQuestionControl.value.answer_options) {
                    (
                      singleQuestionControl.controls[
                        'show_question_answer_condition'
                      ] as FormControl
                    ).setValue(false);
                    singleQuestionControl.disable();
                  }

                  if (
                    answerOptionControl.controls['is_condition_target'].value
                  ) {
                    questionAndAnswerIndexesToCheckConditionAgain.push({
                      questionIndex: questionIndexFromList,
                      answerIndex: answerOptionIndex,
                    });
                  }
                } else {
                  (
                    answerOptionControl.controls[
                      'show_answer_option'
                    ] as FormControl
                  ).setValue(true);
                  if (answerOptionControl.disabled) {
                    answerOptionControl.enable();
                  }
                  (
                    singleQuestionControl.controls[
                      'show_question_answer_condition'
                    ] as FormControl
                  ).setValue(true);
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

  saveAndGoToOverview(questionIndex: number): void {
    if (!this.shouldLockActualSwipe(questionIndex)[0]) {
      this.postAllAnswers(false).then(
        (result: any) => {
          this.dialog.open(DialogPopUpComponent, {
            width: '300px',
            data: {
              data: '',
              content: 'DIALOG.ANSWERS_SAVED',
              isSuccess: true,
            },
          });
          if (this.currentRole === 'Proband') {
            this.router.navigate(['questionnaires/user']);
          } else {
            this.router.navigate(['/questionnaires/user/'], {
              queryParams: { user_id: this.user_id },
            });
          }
        },
        (err: any) => {
          this.alertService.errorObject(err);
        }
      );
    } else {
      this.showLockWarning(this.shouldLockActualSwipe(questionIndex)[1]);
    }
  }

  isQuestionnaireEmpty(): boolean {
    return !(this.myForm.controls['questions'] as FormArray).value.some(
      (question) => {
        return question.answer_options.some((answerOption) => {
          return answerOption.value ? true : false;
        });
      }
    );
  }

  releaseAnswers(): void {
    this.postAllAnswers(true).then(
      (result: any) => {
        if (this.currentRole === 'Proband') {
          if (
            this.questionnaire_instance_status === 'active' ||
            this.questionnaire_instance_status === 'in_progress'
          ) {
            this.questionnaire_instance_status = 'released_once';
          } else if (this.questionnaire_instance_status === 'released_once') {
            this.questionnaire_instance_status = 'released_twice';
          }
        } else if (this.currentRole === 'Untersuchungsteam') {
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

        this.questionnaireService
          .putQuestionnaireInstance(this.questionnaireInstanceId, {
            status: this.questionnaire_instance_status,
            progress: this.progress,
            release_version: this.release_version + 1,
          })
          .then(
            () => {
              if (this.currentRole === 'Proband') {
                this.findAndOpenNextInstance();
              } else {
                this.router.navigate([
                  'studies/:studyName/probands',
                  this.user_id,
                  'questionnaireInstances',
                ]);
              }
            },
            (err) => {
              this.alertService.errorObject(err);
            }
          );
      },
      (err) => {
        this.alertService.errorObject(err);
      }
    );
  }

  formatAnswerOption(answerOption): any {
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

  async postAllAnswers(isRelease): Promise<void> {
    this.answers = [];
    const questions = (this.myForm.controls['questions'] as FormArray).value;
    let number_answers = 0;
    let number_answer_options = 0;
    const request = { answers: [], version: 0, date_of_release: new Date() };
    for (const question of questions) {
      if (question.show_question) {
        number_answer_options =
          number_answer_options + question.answer_options.length;
      }
      question.answer_options.forEach((answerOption) => {
        if (!answerOption.show_answer_option) {
          number_answer_options--;
        }
        if (answerOption.value) {
          number_answers++;
        }
        this.answers.push(this.formatAnswerOption(answerOption));
      });
    }
    this.progress = Math.round((number_answers / number_answer_options) * 100);

    request.answers = this.answers;
    request.version = this.tools.getAnswerVersion(
      this.questionnaire_instance_status,
      this.answerVersionFromServer,
      this.release_version
    );

    if (isRelease && this.currentRole === 'Untersuchungsteam') {
      request.date_of_release = new Date();
    }

    try {
      const result: any = await this.questionnaireService.postAnswers(
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
              progress: this.progress,
              release_version: this.release_version,
            }
          );
          this.questionnaire_instance_status = res.status;
        } else {
          await this.questionnaireService.putQuestionnaireInstance(
            this.questionnaireInstanceId,
            { progress: this.progress }
          );
        }
      }
    } catch (err) {
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

  findAndOpenNextInstance(): void {
    this.questionnaireService
      .getQuestionnaireInstanceQueues()
      .then(async (queuesResult: QuestionnaireInstanceQueue[]) => {
        if (queuesResult.length < 1) {
          timeout(300);
          queuesResult =
            await this.questionnaireService.getQuestionnaireInstanceQueues();
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
                  queuesResult[i].questionnaire_instance_id
                );
              } else if (
                instance &&
                (instance.status === 'released_once' ||
                  instance.status === 'released_twice' ||
                  instance.status === 'expired')
              ) {
                await this.questionnaireService.deleteQuestionnaireInstanceQueue(
                  queuesResult[i].questionnaire_instance_id
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

  validateSampleID(control: AbstractControl): any {
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

  onSendSampleIdClicked(answerOption: FormGroup): void {
    let sampleId = '';
    let dummySampleId = '';

    if (
      !answerOption.controls['sample_id_1'].errors &&
      (!this.studyOfQuestionnaire.has_rna_samples ||
        !answerOption.controls['sample_id_2'].errors)
    ) {
      if (this.studyOfQuestionnaire.has_rna_samples) {
        if (
          answerOption.controls['sample_id_1'].value.charAt(
            this.studyOfQuestionnaire.sample_prefix.length +
              1 +
              (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
          ) === '0' &&
          answerOption.controls['sample_id_2'].value.charAt(
            this.studyOfQuestionnaire.sample_prefix.length +
              1 +
              (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
          ) === '1'
        ) {
          sampleId = answerOption.controls['sample_id_1'].value;
          dummySampleId = answerOption.controls['sample_id_2'].value;
        } else if (
          answerOption.controls['sample_id_1'].value.charAt(
            this.studyOfQuestionnaire.sample_prefix.length +
              1 +
              (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
          ) === '1' &&
          answerOption.controls['sample_id_2'].value.charAt(
            this.studyOfQuestionnaire.sample_prefix.length +
              1 +
              (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
          ) === '0'
        ) {
          sampleId = answerOption.controls['sample_id_2'].value;
          dummySampleId = answerOption.controls['sample_id_1'].value;
        } else {
          answerOption.setErrors({ wrong_format: true });
        }
      } else {
        // Do not check for 0 or 1 if we only have one sample
        sampleId = answerOption.controls['sample_id_1'].value;
      }

      if (
        sampleId !== '' &&
        (!this.studyOfQuestionnaire.has_rna_samples || dummySampleId !== '')
      ) {
        this.sampleTrackingService
          .updateSampleStatusAndSampleDateFor(sampleId, dummySampleId)
          .then((res) => {
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
            answerOption.controls['hasValue'].setValue(true);
            this.postAllAnswers(false);
          })
          .catch((err: HttpErrorResponse) => {
            if (
              err.error.message ===
              'Dummy_sample_id does not match the one in the database'
            ) {
              // set error on dummy_sample_id
              answerOption.controls['sample_id_1'].value.charAt(
                this.studyOfQuestionnaire.sample_prefix.length +
                  1 +
                  (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
              ) === '1' || !this.studyOfQuestionnaire.has_rna_samples
                ? answerOption.controls['sample_id_1'].setErrors({
                    not_exist: true,
                  })
                : answerOption.controls['sample_id_2'].setErrors({
                    not_exist: true,
                  });
            } else if (err.error.message === 'Labresult does not exist') {
              // set error on sample_id
              answerOption.controls['sample_id_1'].value.charAt(
                this.studyOfQuestionnaire.sample_prefix.length +
                  1 +
                  (this.studyOfQuestionnaire.sample_prefix ? 1 : 0)
              ) === '0' || !this.studyOfQuestionnaire.has_rna_samples
                ? answerOption.controls['sample_id_1'].setErrors({
                    not_exist: true,
                  })
                : answerOption.controls['sample_id_2'].setErrors({
                    not_exist: true,
                  });
            } else if (
              err.error.message ===
              'Sample_id does not belong to Proband or it does not exist in db or update params are missing'
            ) {
              answerOption.controls['sample_id_1'].setErrors({
                already_scanned: true,
              });
              if (this.studyOfQuestionnaire.has_rna_samples) {
                answerOption.controls['sample_id_2'].setErrors({
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

  updateState(event?, questionIndex?, answerIndex?): void {
    if (event && questionIndex !== undefined) {
      const answerValue = (
        (
          (
            (this.myForm.controls['questions'] as FormArray).controls[
              questionIndex
            ] as FormGroup
          ).controls['answer_options'] as FormArray
        ).controls[answerIndex] as FormGroup
      ).get('value') as FormControl as FormControl;
      answerValue.setValue(event.value);
    }
    this.checkConditions(questionIndex, answerIndex);
  }

  deselectSingleChoice(questionIndex, answerIndex): void {
    const answerValue = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).get('value') as FormControl as FormControl;
    answerValue.setValue('');
    if (questionIndex !== undefined) {
      this.checkConditions(questionIndex, answerIndex);
      this.postAllAnswers(false);
    }
  }

  isAnswerInArray(answer, answers_string): boolean {
    const answers = answers_string.split(';');
    const foundAnswer = answers.find((item) => {
      return item === answer.value;
    });
    return !!foundAnswer;
  }

  isConditionMet(answer, condition): boolean {
    const type = answer.answer_type_id;

    let answer_values = [];
    let condition_values = [];
    if (type === 3) {
      answer_values = answer.value
        .toString()
        .split(';')
        .map((value) => {
          return parseFloat(value);
        });
      condition_values = condition.condition_value
        .toString()
        .split(';')
        .map((value) => {
          return parseFloat(value);
        });
    } else if (type === 5) {
      answer_values = answer.value
        .toString()
        .split(';')
        .map((answerValue) => {
          return answerValue ? new Date(answerValue) : '';
        });
      condition_values = condition.condition_value
        .toString()
        .split(';')
        .map((conditionValue) => {
          return conditionValue ? new Date(conditionValue) : '';
        });
    } else {
      answer_values = answer.value.toString().split(';');
      condition_values = condition.condition_value.toString().split(';');
    }

    const condition_link = condition.condition_link
      ? condition.condition_link
      : 'OR';

    switch (condition.condition_operand) {
      case '<':
        if (condition_link === 'AND') {
          return condition_values.every((condition_value) => {
            if (condition_value === '') {
              return true;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          });
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value < condition_value
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '>':
        if (condition_link === 'AND') {
          return condition_values.every((condition_value) => {
            if (condition_value === '') {
              return true;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          });
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value > condition_value
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '<=':
        if (condition_link === 'AND') {
          return condition_values.every((condition_value) => {
            if (condition_value === '') {
              return true;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          });
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value <= condition_value
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '>=':
        if (condition_link === 'AND') {
          return condition_values.every((condition_value) => {
            if (condition_value === '') {
              return true;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          });
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? answer_value >= condition_value
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '==':
        if (condition_link === 'AND') {
          return condition_values.every((condition_value) => {
            if (condition_value === '') {
              return true;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? type === 5
                  ? answer_value.equals(condition_value)
                  : answer_value === condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? type === 5
                  ? answer_value.equals(condition_value)
                  : answer_value === condition_value
                : false;
            });
          });
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? type === 5
                  ? answer_value.equals(condition_value)
                  : answer_value === condition_value
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      case '\\=':
        if (condition_link === 'AND') {
          return condition_values.every((condition_value) => {
            if (condition_value === '') {
              return true;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? type === 5
                  ? !answer_value.equals(condition_value)
                  : answer_value !== condition_value
                : false;
            });
          });
        } else if (condition_link === 'OR') {
          return condition_values.some((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? type === 5
                  ? !answer_value.equals(condition_value)
                  : answer_value !== condition_value
                : false;
            });
          });
        } else if (condition_link === 'XOR') {
          const count = condition_values.filter((condition_value) => {
            if (condition_value === '') {
              return false;
            }
            return answer_values.some((answer_value) => {
              return answer_value !== ''
                ? type === 5
                  ? !answer_value.equals(condition_value)
                  : answer_value !== condition_value
                : false;
            });
          }).length;
          return count === 1;
        }
        break;

      default:
        return false;
    }
  }

  private goToSlide(slideNumber: number): void {
    this.questionSwiper.swiper.slideTo(slideNumber);
  }

  private goToNextSlide(): void {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    const lastIndex = this.questionSwiper.swiper.slides.length - 1;

    const questionControl = this.myForm.controls['questions'] as FormArray;

    if (questionIndex === lastIndex) {
      this.goToAnswersView(false);
    } else {
      for (let i = questionIndex; i < lastIndex + 1; i++) {
        if (i === lastIndex) {
          this.goToAnswersView(false);
          break;
        }
        const nextQuestionIsShown =
          (questionControl.controls[i + 1] as FormGroup).controls[
            'show_question'
          ].value === true &&
          (questionControl.controls[i + 1] as FormGroup).controls[
            'show_question_answer_condition'
          ].value === true;
        if (nextQuestionIsShown) {
          this.goToSlide(i);
          break;
        }
      }
    }
  }

  updateAnswerTypeValue(result: {
    dataAsUrl: any;
    answer_option_id: number;
    answerOptionIndex: number;
    file_name: string;
  }): void {
    const questionIndex = this.questionSwiper.swiper.activeIndex;
    const answerValue = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[result.answerOptionIndex] as FormGroup
    ).get('value') as FormControl as FormControl;

    const value =
      result.dataAsUrl !== ''
        ? JSON.stringify({
            file_name: result.file_name,
            data: result.dataAsUrl,
          })
        : '';
    answerValue.setValue(value);
  }

  backClicked(): void {
    this._location.back();
  }

  setAnswerTypeValue(answer, $event, i, j): void {
    answer.controls['value'].value = $event;

    const answerValue = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            i
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[j] as FormGroup
    ).get('value') as FormControl as FormControl;

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
