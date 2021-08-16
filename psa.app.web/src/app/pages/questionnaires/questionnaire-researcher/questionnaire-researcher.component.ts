/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Questionnaire } from '../../../psa.app.core/models/questionnaire';
import { Question } from '../../../psa.app.core/models/question';
import { AnswerOption } from '../../../psa.app.core/models/answerOption';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { Studie } from '../../../psa.app.core/models/studie';
import { TranslateService } from '@ngx-translate/core';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { DialogQuestionnaireSuccessComponent } from '../../../_helpers/dialog-questionnaire-success';
import { DialogQuestionnaireFailComponent } from '../../../_helpers/dialog-questionnaire-fail';
import {
  APP_DATE_FORMATS,
  AppDateAdapter,
} from '../../../_helpers/date-adapter';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { MediaObserver } from '@angular/flex-layout';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { QuestionnaireEditOptions } from './questionnaire-edit-options';
import { DialogYesNoComponent } from '../../../_helpers/dialog-yes-no';
import { filter } from 'rxjs/operators';
import { validateQuestionnaireInstanceCount } from './questionnaire-instance-count-validator';

@Component({
  templateUrl: 'questionnaire-researcher.component.html',
  styleUrls: ['questionnaire-researcher.component.scss'],
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
export class QuestionnaireResearcherComponent implements OnInit {
  fieldsWithErrors: any[];
  currentQuestionnaire: Questionnaire = null;
  questionnaireRequest: Questionnaire;
  public myForm: FormGroup;
  editingStatus = false;
  public questionnaireId: any;
  public questionnaireVersion: any;
  cycle_unit: string;
  publish: string;
  keepAnswers: boolean;
  deactivate_after_days: number;
  cycle_amount: number;
  cycle_per_day: number;
  cycle_first_hour: number;
  type: string;
  activate_at_date: string;
  study_id: string;
  selectedStudy: Studie = null;
  answer_type_id: number;
  panelDrag: any = true;
  studies: Studie[];
  showQuestionnaireCondition = false;
  questionnairesForConditionQuestionnaire = [];
  questionnaires: Questionnaire[];
  selectedConditionType: boolean = undefined;
  selectedQuestionnaireIndex: number = undefined;
  selectedQuestionIndex: number = undefined;
  selectedAnswerOptionsIndex: number = undefined;
  condition_type: string;
  condition_questionnaire_id: string;
  condition_answer_option_id: number;
  condition_operand: string;
  condition_value: any;
  condition_question_id: number;
  deactivate_min_days = 0;
  unitValue: number;
  colsAns: number;
  settingsCols = 12;
  notification_tries: number;
  notification_title: string;
  notification_weekday: string;
  notification_interval: number;
  notification_interval_unit: string;
  compliance_needed: boolean;
  expires_after_days: number;
  finalises_after_days: number;
  conditionCols = 6;
  notification_body_new: string;
  notification_body_in_progress: string;
  needToSentQuestionnaire = false;
  condition_link: string;
  selectedWeekday: string;
  selectedUnit: string;
  isImportedQuestionnaire = false;
  canImportQuestionnaire = true;
  condition_postview = null;
  notify_when_not_filled: boolean;
  notify_when_not_filled_time: string = null;
  notify_when_not_filled_day: number = null;
  supportsKeepAnswers: boolean = environment.isSormasEnabled;

  conditionLinks = QuestionnaireEditOptions.conditionLinks;
  questionnaireTypes = QuestionnaireEditOptions.questionnaireTypes;
  conditionTypes = QuestionnaireEditOptions.conditionTypes;
  conditionTypesForQuestionnaire =
    QuestionnaireEditOptions.conditionTypesForQuestionnaire;
  answerTypes = QuestionnaireEditOptions.answerTypes;
  conditionOperands = QuestionnaireEditOptions.conditionOperands;
  cycleUnits = QuestionnaireEditOptions.cycleUnits;
  publishOptions = QuestionnaireEditOptions.publishOptions;

  hoursOfDay = QuestionnaireEditOptions.getHoursOfDay(
    this.translate.instant('QUESTIONNAIRE_FORSCHER.O_CLOCK')
  );

  hoursPerDay = QuestionnaireEditOptions.hoursPerDay;

  private readonly maxInstanceCount = 1500;

  translationData = {
    deactivate_min_days: this.deactivate_min_days.toString(),
    maxInstanceCount: this.maxInstanceCount.toString(),
  };

  timepickerTheme: NgxMaterialTimepickerTheme = {
    container: {
      bodyBackgroundColor: '#ffffff',
      buttonColor: '#6d9124',
    },
    dial: {
      dialBackgroundColor: '#6d9124',
    },
    clockFace: {
      clockFaceBackgroundColor: '#7dd4ff',
      clockHandColor: '#307292',
      clockFaceTimeInactiveColor: '#307292',
    },
  };

  isLoading = false;

  canDeactivate(): Observable<boolean> | boolean {
    return this.myForm ? !this.myForm.dirty : true;
    // insert logic to check if there are pending changes here;
    // returning true will navigate without confirmation
    // returning false will show a confirm alert before navigating away
  }

  // @HostListener allows us to also guard against browser refresh, close, etc.
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any): void {
    if (!this.canDeactivate()) {
      // This message is displayed to the user in IE and Edge when they navigate without using Angular routing
      // (type another URL/close the browser/etc)
      $event.returnValue = this.translate.instant('WARNING.ANSWERS');
    }
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    public dialog: MatDialog,
    private mediaObserver: MediaObserver,
    private alertService: AlertService,
    private questionnaireService: QuestionnaireService,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    if ('id' in this.activatedRoute.snapshot.params) {
      this.editingStatus = true;
      this.questionnaireId = this.activatedRoute.snapshot.paramMap.get('id');
      this.questionnaireVersion =
        this.activatedRoute.snapshot.paramMap.get('version');
    }

    const gridAns = new Map([
      ['xs', 1],
      ['sm', 1],
      ['md', 2],
      ['lg', 3],
      ['xl', 4],
    ]);
    this.mediaObserver
      .asObservable()
      .subscribe((changes) =>
        changes.forEach(
          (change) => (this.colsAns = gridAns.get(change.mqAlias))
        )
      );
  }

  ngOnInit(): void {
    this.questionnaireService.getQuestionnaires().then(
      async (result) => {
        this.questionnaires = result.questionnaires;
        this.questionnairesForConditionQuestionnaire = this.questionnaires;

        this.studies = (
          (await this.questionnaireService.getStudies()) as any
        ).studies;

        if (this.editingStatus) {
          this.questionnaireService
            .getQuestionnaire(this.questionnaireId, this.questionnaireVersion)
            .then(
              (result2: any) => {
                this.currentQuestionnaire = result2;
                this.initForm(this.currentQuestionnaire);
              },
              (err: any) => {
                this.alertService.errorObject(err);
              }
            );
        } else {
          this.initForm();
        }
      },
      (err: any) => {
        this.alertService.errorObject(err);
      }
    );

    this.onResize();
  }

  selectStudy(study_id: string): void {
    this.selectedStudy = this.studies.find((study) => study.name === study_id);

    if (
      this.myForm &&
      this.selectedStudy &&
      !this.selectedStudy.has_answers_notify_feature
    ) {
      // reset notify variables
      this.myForm.get('notify_when_not_filled').setValue(false);
      this.myForm.get('notify_when_not_filled_time').setValue(null);
      this.myForm.get('notify_when_not_filled_day').setValue(null);

      const questionFGs: FormGroup[] = (
        this.myForm.get('questions') as FormArray
      ).controls as FormGroup[];
      if (questionFGs && questionFGs.length > 0) {
        questionFGs.forEach((fgQuestion: FormGroup) => {
          const answerOptionFGs: FormGroup[] = (
            fgQuestion.get('answer_options') as FormArray
          ).controls as FormGroup[];
          if (answerOptionFGs && answerOptionFGs.length > 0) {
            answerOptionFGs.forEach((fgAnswerOption: FormGroup) => {
              (fgAnswerOption.get('is_notable') as FormArray).reset();
              const valueFGs: FormGroup[] = (
                fgAnswerOption.get('values') as FormArray
              ).controls as FormGroup[];
              if (valueFGs && valueFGs.length > 0) {
                valueFGs.forEach((fgValue: FormGroup) => {
                  fgValue.get('is_notable').setValue(false);
                });
              }
            });
          }
        });
      }
    }
  }

  /**
   * Create or update questionnaire
   * @method onSubmit
   */
  onSubmit(action: string): void {
    if (this.isImportedQuestionnaire) {
      this.myForm.enable();
    }

    if (this.myForm.controls['cycle_unit'].value === 'once') {
      this.myForm.controls['deactivate_after_days'].clearValidators();
      this.myForm.controls['deactivate_after_days'].setValue(1);
      this.myForm.controls['deactivate_after_days'].updateValueAndValidity();

      this.myForm.controls['cycle_amount'].clearValidators();
      this.myForm.controls['cycle_amount'].setValue(1);
      this.myForm.controls['cycle_amount'].updateValueAndValidity();
    }

    if (
      !(
        this.myForm.controls['notification_tries'].value > 0 &&
        (this.myForm.controls['cycle_unit'].value === 'week' ||
          this.myForm.controls['cycle_unit'].value === 'month')
      )
    ) {
      this.myForm.get('notification_weekday').clearValidators();
      this.myForm.get('notification_weekday').updateValueAndValidity();
    }

    if (
      !(
        this.myForm.controls['notification_tries'].value > 1 &&
        (this.myForm.controls['cycle_unit'].value === 'week' ||
          this.myForm.controls['cycle_unit'].value === 'month')
      )
    ) {
      this.myForm.get('notification_interval').clearValidators();
      this.myForm.get('notification_interval').updateValueAndValidity();
      this.myForm.get('notification_interval_unit').clearValidators();
      this.myForm.get('notification_interval_unit').updateValueAndValidity();
    }

    if (this.myForm.controls['cycle_unit'].value !== 'date') {
      this.myForm.controls['activate_at_date'].clearValidators();
      this.myForm.controls['activate_at_date'].updateValueAndValidity();
    }

    if (this.myForm.controls['cycle_unit'].value === 'date') {
      this.myForm.controls['deactivate_after_days'].clearValidators();
      this.myForm.controls['deactivate_after_days'].setValue(0);
      this.myForm.controls['deactivate_after_days'].updateValueAndValidity();

      this.myForm.controls['cycle_amount'].clearValidators();
      this.myForm.controls['cycle_amount'].setValue(0);
      this.myForm.controls['cycle_amount'].updateValueAndValidity();

      this.myForm.controls['activate_after_days'].clearValidators();
      this.myForm.controls['activate_after_days'].setValue(0);
      this.myForm.controls['activate_after_days'].updateValueAndValidity();
    }

    if (this.myForm.controls['cycle_unit'].value === 'spontan') {
      this.myForm.controls['deactivate_after_days'].clearValidators();
      this.myForm.controls['deactivate_after_days'].setValue(0);
      this.myForm.controls['deactivate_after_days'].updateValueAndValidity();

      this.myForm.controls['cycle_amount'].clearValidators();
      this.myForm.controls['cycle_amount'].setValue(0);
      this.myForm.controls['cycle_amount'].updateValueAndValidity();

      this.myForm.controls['activate_after_days'].clearValidators();
      this.myForm.controls['activate_after_days'].setValue(0);
      this.myForm.controls['activate_after_days'].updateValueAndValidity();

      this.myForm.get('notification_interval').clearValidators();
      this.myForm.get('notification_interval').updateValueAndValidity();
      this.myForm.get('notification_interval_unit').clearValidators();
      this.myForm.get('notification_interval_unit').updateValueAndValidity();

      this.myForm.get('notification_body_new').clearValidators();
      this.myForm.get('notification_body_new').updateValueAndValidity();
      this.myForm.get('notification_body_new').setValue('');
      this.myForm.get('notification_body_in_progress').clearValidators();
      this.myForm.get('notification_body_in_progress').updateValueAndValidity();
      this.myForm.get('notification_body_in_progress').setValue('');

      this.myForm.get('activate_at_date').clearValidators();
      this.myForm.get('activate_at_date').updateValueAndValidity();
      this.myForm.get('notification_tries').clearValidators();
      this.myForm.get('notification_tries').setValue(0);
      this.myForm.get('notification_tries').updateValueAndValidity();
      this.myForm.get('notification_title').clearValidators();
      this.myForm.get('notification_title').setValue('');
      this.myForm.get('notification_title').updateValueAndValidity();
    }

    if (this.getFormValidationErrors() > 0) {
      this.showFailureDialog(
        this.translate.instant('QUESTIONNAIRE_FORSCHER.FORM_INVALID') +
          this.fieldsWithErrors.toString()
      );
    } else {
      this.isImportedQuestionnaire = false;

      (this.myForm.controls['questions'] as FormArray).value.forEach(
        (question, questionIndex) => {
          const questionController = (
            this.myForm.controls['questions'] as FormArray
          ).controls[questionIndex] as FormGroup;

          let questionConditionLink = null;
          if (questionController.controls['condition'] as FormGroup) {
            questionConditionLink = (
              questionController.controls['condition'] as FormGroup
            ).controls['condition_link'];

            if (questionConditionLink.value === null) {
              questionConditionLink.disable();
            }
          }
          /*
           *Disable controller that should not be send with request
           */
          // Disable condition link if data is null
          if (questionController.controls['has_condition'] !== undefined) {
            questionController.controls['has_condition'].disable();
          }
          if (
            (questionController.controls['condition'] as FormGroup) !==
            undefined
          ) {
            (questionController.controls['condition'] as FormGroup).controls[
              'condition_question_id'
            ].disable();
          }
          questionController.controls['tmp_for_condition'].disable();
          if (
            questionController.controls['id'].value == null ||
            questionController.controls['id'].value === -1 ||
            action === 'revise'
          ) {
            questionController.controls['id'].disable();
          }

          const questions = this.myForm.controls['questions'] as FormArray;

          // For every subquestion (Unterfrage) in the form
          (
            (questions.controls[questionIndex] as FormGroup).controls[
              'answer_options'
            ] as FormArray
          ).value.forEach((answer, answerIndex) => {
            const answerOptionController = (
              (
                (this.myForm.controls['questions'] as FormArray).controls[
                  questionIndex
                ] as FormGroup
              ).controls['answer_options'] as FormArray
            ).controls[answerIndex] as FormGroup;
            answerOptionController.removeControl('current_answer_type_id');
            answerOptionController.controls['coding_enable'].disable();

            if (
              answerOptionController.controls['id'] &&
              (answerOptionController.controls['id'].value == null ||
                answerOptionController.controls['id'].value === -1)
            ) {
              answerOptionController.controls['id'].disable();
            }

            if (
              answerOptionController.controls['has_condition'] !== undefined
            ) {
              answerOptionController.controls['has_condition'].disable();
            }
            if (
              answerOptionController.controls['is_condition_target'] !==
              undefined
            ) {
              answerOptionController.controls['is_condition_target'].disable();
            }
            answerOptionController.controls['tmp_for_condition'].disable();
            if (
              (answerOptionController.controls['condition'] as FormGroup) !==
              undefined
            ) {
              (
                answerOptionController.controls['condition'] as FormGroup
              ).controls['condition_question_id'].disable();
            }
          });
        }
      );

      this.questionnaireRequest = this.generateQuestionnaireRequestDataFrom(
        this.myForm
      );

      switch (action) {
        case 'create': {
          this.createQuestionnaire(this.questionnaireRequest);
          break;
        }

        case 'update': {
          this.updateQuestionnaire(
            this.questionnaireId,
            this.questionnaireVersion,
            this.questionnaireRequest,
            false
          );
          break;
        }

        case 'revise': {
          this.updateQuestionnaire(
            this.questionnaireId,
            this.questionnaireVersion,
            this.questionnaireRequest,
            true
          );
          break;
        }
      }
    }
  }

  removeConditionErrors(questionnaire: Questionnaire): void {
    if (questionnaire.condition_error !== undefined) {
      delete questionnaire.condition_error;
    }
    for (const question of questionnaire.questions) {
      if (question.condition_error !== undefined) {
        delete question.condition_error;
      }
      for (const answerOption of question.answer_options) {
        if (answerOption.condition_error !== undefined) {
          delete answerOption.condition_error;
        }
      }
    }
  }

  createQuestionnaire(postData: Questionnaire): void {
    this.removeConditionErrors(postData);
    this.questionnaireService
      .postQuestionnaire(postData)
      .then((result: any) => {
        this.currentQuestionnaire = result;
        this.myForm.enable();
        this.myForm.markAsPristine();
        this.editingStatus = true;
        this.questionnaireId = this.currentQuestionnaire.id;
        this.questionnaireVersion = this.currentQuestionnaire.version;
        this.ngOnInit();
        this.showSuccessDialog(this.currentQuestionnaire.name);
      })
      .catch((err: HttpErrorResponse) => {
        this.showFailureDialog(err.error.message);
      });
  }

  updateQuestionnaire(
    id: number,
    version: number,
    postData: Questionnaire,
    doRevise: boolean
  ): void {
    this.removeConditionErrors(postData);
    let p: Promise<unknown>;
    if (doRevise) {
      p = this.questionnaireService.reviseQuestionnaire(id, postData);
    } else {
      p = this.questionnaireService.putQuestionnaire(id, version, postData);
    }
    p.then((result: any) => {
      this.myForm.markAsPristine();
      this.dialog.open(DialogQuestionnaireSuccessComponent, {
        width: '500px',
        data: { data: result.name },
      });
      this.router
        .navigateByUrl('/', { skipLocationChange: true })
        .then(() =>
          this.router.navigate([
            '/questionnaire',
            result.id,
            result.version,
            'edit',
          ])
        );
    }).catch((err: HttpErrorResponse) => {
      this.dialog.open(DialogQuestionnaireFailComponent, {
        width: '500px',
        data: { data: err.error.message },
      });
    });
  }

  public initForm(questionnaire?: Questionnaire): void {
    let name: string;
    let activate_after_days: number;
    if (questionnaire) {
      this.canImportQuestionnaire = false;
      name = questionnaire.name;
      this.type = questionnaire.type;
      this.study_id = questionnaire.study_id;
      this.selectStudy(this.study_id);
      this.cycle_amount = questionnaire.cycle_amount;
      this.activate_at_date = questionnaire.activate_at_date;
      this.cycle_unit = questionnaire.cycle_unit;
      this.cycle_per_day = questionnaire.cycle_per_day;
      this.cycle_first_hour = questionnaire.cycle_first_hour;
      this.publish = questionnaire.publish;
      this.keepAnswers = questionnaire.keep_answers;
      activate_after_days = questionnaire.activate_after_days;
      this.deactivate_after_days = questionnaire.deactivate_after_days;
      this.notification_tries = questionnaire.notification_tries;
      this.notification_title = questionnaire.notification_title;

      this.notification_weekday = questionnaire.notification_weekday;
      this.notification_interval = questionnaire.notification_interval;
      this.notification_interval_unit =
        questionnaire.notification_interval_unit;
      this.compliance_needed = questionnaire.compliance_needed;
      this.notify_when_not_filled = questionnaire.notify_when_not_filled;
      this.notify_when_not_filled_time =
        questionnaire.notify_when_not_filled_time;
      this.notify_when_not_filled_day =
        questionnaire.notify_when_not_filled_day;
      this.expires_after_days = questionnaire.expires_after_days;
      this.finalises_after_days = questionnaire.finalises_after_days;
      this.notification_body_new = questionnaire.notification_body_new;
      this.notification_body_in_progress =
        questionnaire.notification_body_in_progress;

      if (questionnaire.condition) {
        this.condition_type = questionnaire.condition.condition_type;
        this.condition_questionnaire_id =
          questionnaire.condition.condition_target_questionnaire +
          '-' +
          questionnaire.condition.condition_target_questionnaire_version;
        this.condition_answer_option_id =
          questionnaire.condition.condition_target_answer_option;
        this.condition_type = questionnaire.condition.condition_type;
        this.condition_operand = questionnaire.condition.condition_operand;

        this.setSelectedConditionTypeQuestionnaireCondition(
          this.condition_type
        );

        this.questionnairesForConditionQuestionnaire.forEach(
          (questionnaireResponse, questionnaireIndex) => {
            if (
              questionnaireResponse.id + '-' + questionnaireResponse.version ===
              this.condition_questionnaire_id
            ) {
              this.setSelectedQuestionnaireIndexQuestionnaireCondition(
                questionnaireIndex
              );
            }
            questionnaireResponse.questions.forEach(
              (question, questionIndex) => {
                question.answer_options.forEach(
                  (answerOption, answerOptionIndex) => {
                    if (answerOption.id === this.condition_answer_option_id) {
                      this.setSelectedQuestionIndexQuestionnaireCondition(
                        questionIndex
                      );
                      this.setSelectedAnswerOptionsIndexQuestionnaireCondition(
                        answerOptionIndex
                      );
                      this.condition_question_id = answerOption.question_id;
                      if (answerOption.answer_type_id === 5) {
                        this.condition_value = new Date(
                          questionnaire.condition.condition_value
                        );
                      } else if (
                        answerOption.answer_type_id === 1 ||
                        answerOption.answer_type_id === 2
                      ) {
                        this.condition_value =
                          questionnaire.condition.condition_value.split(';');
                        this.condition_link =
                          questionnaire.condition.condition_link;
                      } else {
                        this.condition_value =
                          questionnaire.condition.condition_value;
                      }
                    }
                  }
                );
              }
            );
          }
        );
      }
    } else {
      name = '';
      this.study_id = null;
      this.type = null;
      this.cycle_amount = null;
      this.activate_at_date = null;
      this.cycle_unit = '';
      this.cycle_per_day = null;
      this.cycle_first_hour = null;
      this.publish = 'allaudiences';
      this.keepAnswers = false;
      activate_after_days = null;
      this.deactivate_after_days = null;
      this.notification_tries = null;
      this.notification_title = null;
      this.notification_weekday = null;
      this.notification_interval = null;
      this.notification_interval_unit = null;
      this.notification_body_new = null;
      this.notification_body_in_progress = null;
      this.compliance_needed = false;
      this.notify_when_not_filled = false;
      this.notify_when_not_filled_time = null;
      this.notify_when_not_filled_day = null;
      this.expires_after_days = 5;
      this.finalises_after_days = 2;
    }

    this.myForm = new FormGroup(
      {
        name: new FormControl(name, Validators.required),
        type: new FormControl(this.type, Validators.required),
        study_id: new FormControl(this.study_id, Validators.required),
        cycle_amount: new FormControl(this.cycle_amount, Validators.required),
        activate_at_date: new FormControl(this.activate_at_date, [
          Validators.required,
          Validators.min(1),
        ]),
        cycle_unit: new FormControl(this.cycle_unit, Validators.required),
        cycle_per_day: new FormControl(this.cycle_per_day),
        cycle_first_hour: new FormControl(this.cycle_first_hour),
        publish: new FormControl(this.publish, Validators.required),
        keep_answers: new FormControl(this.keepAnswers),
        activate_after_days: new FormControl(activate_after_days, [
          Validators.min(0),
          Validators.required,
        ]),
        deactivate_after_days: new FormControl(this.deactivate_after_days, [
          Validators.min(this.deactivate_min_days),
          Validators.required,
        ]),
        notification_tries: new FormControl(
          this.notification_tries,
          Validators.required
        ),
        notification_title: new FormControl(
          this.notification_title,
          Validators.required
        ),
        notification_weekday: new FormControl(
          this.notification_weekday,
          Validators.required
        ),
        notification_interval: new FormControl(
          this.notification_interval,
          Validators.required
        ),
        notification_interval_unit: new FormControl(
          this.notification_interval_unit,
          Validators.required
        ),
        notification_body_new: new FormControl(
          this.notification_body_new,
          Validators.required
        ),
        notification_body_in_progress: new FormControl(
          this.notification_body_in_progress,
          Validators.required
        ),
        compliance_needed: new FormControl(this.compliance_needed),
        notify_when_not_filled: new FormControl(this.notify_when_not_filled),
        notify_when_not_filled_time: new FormControl(
          this.notify_when_not_filled_time
        ),
        notify_when_not_filled_day: new FormControl(
          this.notify_when_not_filled_day
        ),

        expires_after_days: new FormControl(this.expires_after_days, [
          Validators.min(1),
        ]),
        finalises_after_days: new FormControl(this.finalises_after_days, [
          Validators.min(1),
        ]),
        questions: new FormArray([]),
        condition_error: new FormControl(
          questionnaire ? questionnaire.condition_error : undefined
        ),
      },
      validateQuestionnaireInstanceCount(this.maxInstanceCount)
    );

    this.myForm.controls['notify_when_not_filled'].setValidators(
      this.mustNotEmptyTimeAndDayIfEnabled(this.myForm)
    );

    if (this.notification_tries === 0) {
      this.myForm.controls['notification_title'].clearValidators();
      this.myForm.controls['notification_weekday'].clearValidators();
      this.myForm.controls['notification_interval'].clearValidators();
      this.myForm.controls['notification_interval_unit'].clearValidators();
      this.myForm.controls['notification_body_new'].clearValidators();
      this.myForm.controls['notification_body_in_progress'].clearValidators();
    }

    if (this.notification_tries < 2) {
      this.myForm.controls['notification_interval'].clearValidators();
      this.myForm.controls['notification_interval_unit'].clearValidators();
    }

    if (!questionnaire) {
      this.addQuestion();
      this.addValue(0, 0);
    } else {
      if (questionnaire.condition) {
        this.addQuestionnaireCondition();
      }
      questionnaire.questions.forEach((question, questionIndex) => {
        this.addQuestion(question);
        question.answer_options.forEach((answerOption, answerOptionIndex) => {
          this.addAnswer(questionIndex, answerOption);

          this.checkAnswerType(questionIndex, answerOptionIndex, true);
          for (let i = 0; i < answerOption.values.length; i++) {
            this.addValue(
              questionIndex,
              answerOptionIndex,
              answerOption.values[i],
              answerOption.values_code ? answerOption.values_code[i] : null,
              answerOption.is_notable ? answerOption.is_notable[i] : false
            );
          }
        });
      });
    }
    this.setNotificationControls();
    this.checkCycleUnit();
    if (this.isImportedQuestionnaire) {
      this.myForm.controls['questions'].disable();
    }
  }

  /**
   * Adds a question FormGroup to the questionnaire <FormArray>FormControl(questions)
   * @method addQuestion
   * @param question you want to add to questionnaire (Fragebogen)
   * @return void
   */
  addQuestion(question?: Question): void {
    const answer_options = new FormArray([]);
    const text = question ? question.text : '';
    const label = question ? question.label : '';
    const id = question ? question.id : null;
    const position = question ? question.position : null;
    const isMandatory =
      question && question.is_mandatory ? question.is_mandatory : false;
    const hasCondition = !!(question && question.condition);
    const questionIndex = (this.myForm.controls['questions'] as FormArray)
      .length;

    (this.myForm.controls['questions'] as FormArray).push(
      new FormGroup({
        text: new FormControl(text, [
          Validators.required,
          this.validateFormControlTextVariableValue,
        ]),
        label: new FormControl(label),
        id: new FormControl(id),
        position: new FormControl(position),
        is_mandatory: new FormControl(isMandatory),
        has_condition: new FormControl(hasCondition),
        condition_error: new FormControl(
          question ? question.condition_error : undefined
        ),
        tmp_for_condition: new FormGroup({
          questionnairesForQuestionCondition: new FormControl(undefined),
          questionMessageNeedToSentQuestionnaire: new FormControl(undefined),
          selectedConditionTypeQuestion: new FormControl(undefined),
          selectedQuestionnaireIndexQuestion: new FormControl(undefined),
          selectedQuestionIndexQuestion: new FormControl(undefined),
          selectedAnswerOptionsIndexQuestion: new FormControl(undefined),
        }),
        answer_options,
      })
    );
    if (hasCondition) {
      this.addQuestionCondition(questionIndex, question);
    }

    if (!question) {
      this.addAnswer(questionIndex);
    }
  }

  removeQuestion(questionIndex: number): void {
    // remove question from the list
    const control = this.myForm.controls['questions'] as FormArray;
    control.removeAt(questionIndex);
  }

  /**
   * Adds a AnswerOption FormGroup to the question's <FormArray>FormControl(answer)
   * @method addAnswer
   * @param questionIndex of the question to which place is to be added
   * @param answerOption of the question to which place is to be added
   */
  addAnswer(questionIndex: number, answerOption?: AnswerOption): void {
    const text = answerOption ? answerOption.text : '';
    const label = answerOption ? answerOption.label : '';
    this.answer_type_id = answerOption ? answerOption.answer_type_id : null;
    const values = new FormArray([]);
    const values_code = new FormArray([]);
    const is_notable = new FormArray([]);
    const id = answerOption ? answerOption.id : null;
    const position = answerOption ? answerOption.position : null;
    const restriction_min = this.answer_type_id
      ? this.answer_type_id === 3 || this.answer_type_id === 5
        ? answerOption.restriction_min
        : null
      : null;
    const restriction_max = this.answer_type_id
      ? this.answer_type_id === 3 || this.answer_type_id === 5
        ? answerOption.restriction_max
        : null
      : null;
    const is_decimal = this.answer_type_id
      ? this.answer_type_id === 3 || this.answer_type_id === 5
        ? answerOption.is_decimal
        : null
      : null;
    const coding_enable = this.answer_type_id
      ? this.answer_type_id === 1 || this.answer_type_id === 2
        ? true
        : false
      : true;
    const has_condition = !!(answerOption && answerOption.condition);
    const is_condition_target =
      answerOption && answerOption.is_condition_target
        ? answerOption.is_condition_target
        : false;
    const answerIndex = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).length;

    (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).push(
      new FormGroup({
        id: new FormControl(id),
        position: new FormControl(position),
        text: new FormControl(text, this.validateFormControlTextVariableValue),
        label: new FormControl(label),
        answer_type_id: new FormControl(
          this.answer_type_id,
          Validators.required
        ),
        current_answer_type_id: new FormControl(this.answer_type_id),
        coding_enable: new FormControl(coding_enable),
        has_condition: new FormControl(has_condition),
        condition_error: new FormControl(
          answerOption ? answerOption.condition_error : undefined
        ),
        is_condition_target: new FormControl(is_condition_target),
        tmp_for_condition: new FormGroup({
          questionnairesForAnswerOptionCondition: new FormControl(undefined),
          answerOptionMessageNeedToSentQuestionnaire: new FormControl(
            undefined
          ),
          selectedConditionTypeAnswerOption: new FormControl(undefined),
          selectedQuestionnaireIndexAnswerOption: new FormControl(undefined),
          selectedQuestionIndexAnswerOption: new FormControl(undefined),
          selectedAnswerOptionsIndexAnswerOption: new FormControl(undefined),
          condition_link: new FormControl(undefined),
        }),
        is_notable,
        values,
        values_code,
      })
    );

    if (id == null) {
      (
        (
          (
            (this.myForm.controls['questions'] as FormArray).controls[
              questionIndex
            ] as FormGroup
          ).controls['answer_options'] as FormArray
        ).controls[answerIndex] as FormGroup
      ).removeControl('id');
    }
    if (has_condition) {
      this.addAnswerCondition(questionIndex, answerIndex, answerOption);
    }
    if (restriction_min || restriction_max) {
      this.addAnswerOptionsRestriction(
        questionIndex,
        answerIndex,
        answerOption
      );
    }
  }

  addAnswerOptionsRestriction(
    questionIndex: number,
    answerIndex: number,
    answerOption?: AnswerOption
  ): void {
    const restriction_min = this.answer_type_id
      ? (this.answer_type_id === 3 || this.answer_type_id === 5) && answerOption
        ? answerOption.restriction_min
        : null
      : null;
    const restriction_max = this.answer_type_id
      ? (this.answer_type_id === 3 || this.answer_type_id === 5) && answerOption
        ? answerOption.restriction_max
        : null
      : null;
    const is_decimal = this.answer_type_id
      ? (this.answer_type_id === 3 || this.answer_type_id === 5) && answerOption
        ? answerOption.is_decimal
        : false
      : false;
    const answerControl = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).controls[answerIndex] as FormGroup;

    answerControl.addControl(
      'restriction_min',
      new FormControl(restriction_min, Validators.required)
    );
    answerControl.addControl(
      'restriction_max',
      new FormControl(restriction_max, Validators.required)
    );
    answerControl.addControl(
      'is_decimal',
      new FormControl(is_decimal, Validators.required)
    );
    answerControl.setValidators(this.validateRestrictions);
    answerControl.updateValueAndValidity();
  }

  checkRestrictions(questionIndex: number, answerIndex: number): void {
    const answerControl = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).controls[answerIndex] as FormGroup;
    if (answerControl.get('restriction_max')) {
      answerControl.clearValidators();
      answerControl.removeControl('restriction_min');
      answerControl.removeControl('restriction_max');
      answerControl.removeControl('is_decimal');
      answerControl.updateValueAndValidity();
    }
  }

  validateRestrictions(AC: AbstractControl): any {
    const restriction_min = AC.get('restriction_min').value;
    const restriction_max = AC.get('restriction_max').value;
    const is_decimal = AC.get('is_decimal').value;

    if (is_decimal === true) {
      if (
        (restriction_min === null ||
          restriction_min.toString().match(/-?(\d+(?:[\.\,]\d{2})?)$/) ===
            null) &&
        (restriction_max === null ||
          restriction_max.toString().match(/-?(\d+(?:[\.\,]\d{2})?)$/) === null)
      ) {
        AC.get('restriction_min').setErrors({ notDecimalNumber: true });
        AC.get('restriction_max').setErrors({ notDecimalNumber: true });
        return { notDecimalNumber: true };
      } else {
        AC.get('restriction_min').setErrors(null);
        AC.get('restriction_max').setErrors(null);
      }
      if (
        restriction_min === null ||
        restriction_min.toString().match(/-?(\d+(?:[\.\,]\d{2})?)$/) === null
      ) {
        AC.get('restriction_min').setErrors({ notDecimalNumber: true });
        return { notDecimalNumber: true };
      } else {
        AC.get('restriction_min').setErrors(null);
      }
      if (
        restriction_max === null ||
        restriction_max.toString().match(/-?(\d+(?:[\.\,]\d{2})?)$/) === null
      ) {
        AC.get('restriction_max').setErrors({ notDecimalNumber: true });
        return { notDecimalNumber: true };
      } else {
        AC.get('restriction_max').setErrors(null);
      }
      if (
        restriction_min &&
        restriction_max &&
        parseFloat(restriction_min) >= parseFloat(restriction_max)
      ) {
        AC.get('restriction_min').setErrors({ valuesValidate: true });
        AC.get('restriction_max').setErrors({ valuesValidate: true });
        return { valuesValidate: true };
      } else {
        AC.get('restriction_min').setErrors(null);
        AC.get('restriction_max').setErrors(null);
        return null;
      }
    } else {
      if (
        (restriction_min === null ||
          restriction_min.toString().match(/^([+-]?[1-9]\d*|0)$/) === null) &&
        (restriction_max === null ||
          restriction_max.toString().match(/^([+-]?[1-9]\d*|0)$/) === null)
      ) {
        AC.get('restriction_min').setErrors({ notNumber: true });
        AC.get('restriction_max').setErrors({ notNumber: true });
        return { notNumber: true };
      } else {
        AC.get('restriction_min').setErrors(null);
        AC.get('restriction_max').setErrors(null);
      }
      if (
        restriction_min === null ||
        restriction_min.toString().match(/^([+-]?[1-9]\d*|0)$/) === null
      ) {
        AC.get('restriction_min').setErrors({ notNumber: true });
        return { notNumber: true };
      } else {
        AC.get('restriction_min').setErrors(null);
      }
      if (
        restriction_max === null ||
        restriction_max.toString().match(/^([+-]?[1-9]\d*|0)$/) === null
      ) {
        AC.get('restriction_max').setErrors({ notNumber: true });
        return { notNumber: true };
      } else {
        AC.get('restriction_max').setErrors(null);
      }
      if (
        restriction_min &&
        restriction_max &&
        parseFloat(restriction_min) >= parseFloat(restriction_max)
      ) {
        AC.get('restriction_min').setErrors({ valuesValidate: true });
        AC.get('restriction_max').setErrors({ valuesValidate: true });
        return { valuesValidate: true };
      } else {
        AC.get('restriction_min').setErrors(null);
        AC.get('restriction_max').setErrors(null);
        return null;
      }
    }
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
    const condition_questionnaire_version = answerOption
      ? answerOption.condition.condition_target_questionnaire_version
      : null;
    const condition_answer_option_id = answerOption
      ? answerOption.condition.condition_target_answer_option
      : null;
    const condition_target_question_pos = answerOption
      ? answerOption.condition.condition_target_question_pos
      : null;
    const condition_target_answer_option_pos = answerOption
      ? answerOption.condition.condition_target_answer_option_pos
      : null;
    const condition_operand = answerOption
      ? answerOption.condition.condition_operand
      : null;
    let condition_value: any = answerOption
      ? answerOption.condition.condition_value
      : null;
    let condition_question_id;
    const condition_link = answerOption
      ? answerOption.condition.condition_link
      : undefined;

    if (answerOption) {
      this.setSelectedConditionTypeAnswerOptionCondition(
        questionIndex,
        answerIndex,
        condition_type
      );
      const questionnairesForAnswerOptionConditionValue = (
        answerControl.controls['tmp_for_condition'] as FormGroup
      ).controls['questionnairesForAnswerOptionCondition'].value;
      if (questionnairesForAnswerOptionConditionValue) {
        questionnairesForAnswerOptionConditionValue.forEach(
          (questionnaireResponse, questionnaireIndex) => {
            if (
              questionnaireResponse.id === condition_questionnaire_id &&
              (condition_questionnaire_id === -1 ||
                questionnaireResponse.version ===
                  condition_questionnaire_version)
            ) {
              this.setSelectedQuestionnaireIndexAnswerOptionCondition(
                questionIndex,
                answerIndex,
                questionnaireIndex
              );
            }
            questionnaireResponse.questions.forEach(
              (questionFromList, questionIndexFromList) => {
                questionFromList.answer_options.forEach(
                  (answerOptionFromList, answerOptionIndexFromList) => {
                    if (
                      (questionnaireResponse.id !== -1 &&
                        answerOptionFromList.id ===
                          condition_answer_option_id) ||
                      (questionnaireResponse.id === -1 &&
                        condition_target_question_pos ===
                          questionFromList.position &&
                        condition_target_answer_option_pos ===
                          answerOptionFromList.position)
                    ) {
                      if (answerOptionFromList.answer_type_id === 5) {
                        condition_value = new Date(condition_value);
                      } else if (
                        answerOptionFromList.answer_type_id === 1 ||
                        answerOptionFromList.answer_type_id === 2
                      ) {
                        condition_value = condition_value.toString().split(';');
                      }
                      this.setSelectedQuestionIndexAnswerOptionCondition(
                        questionIndex,
                        answerIndex,
                        questionIndexFromList
                      );
                      this.setSelectedAnswerOptionsIndexAnswerOptionCondition(
                        questionIndex,
                        answerIndex,
                        answerOptionIndexFromList
                      );
                      condition_question_id = answerOptionFromList.question_id
                        ? answerOptionFromList.question_id
                        : -1;
                    }
                  }
                );
              }
            );
          }
        );
      }
    }

    answerControl.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(condition_type, Validators.required),
        condition_target_questionnaire: new FormControl(
          this.isImportedQuestionnaire && condition_questionnaire_id === -1
            ? condition_questionnaire_id
            : condition_questionnaire_id +
              '-' +
              condition_questionnaire_version,
          Validators.required
        ),
        condition_target_answer_option: new FormControl(
          condition_answer_option_id,
          Validators.required
        ),
        condition_target_question_pos: new FormControl(
          condition_target_question_pos
        ),
        condition_target_answer_option_pos: new FormControl(
          condition_target_answer_option_pos
        ),
        condition_question_id: new FormControl(
          condition_question_id,
          Validators.required
        ),
        condition_operand: new FormControl(
          condition_operand,
          Validators.required
        ),
        condition_value: new FormControl(condition_value, Validators.required),
        condition_link: new FormControl(condition_link, Validators.required),
      })
    );
    answerControl.controls['has_condition'].setValue(true);
    answerControl.controls['condition_error'].setValue(undefined);
  }

  moveAnswerUp(questionIndex: number, oldAnswerIndex: number): void {
    if (oldAnswerIndex === 0) {
      return;
    }
    const control = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['answer_options'] as FormArray;
    const newAnswerIndex = oldAnswerIndex - 1;
    const movingAnswer = control.at(newAnswerIndex);
    const reverseMovingAnswer = control.at(oldAnswerIndex);
    control.setControl(oldAnswerIndex, movingAnswer);
    control.setControl(newAnswerIndex, reverseMovingAnswer);
  }

  moveAnswerDown(questionIndex: number, oldAnswerIndex: number): void {
    const control = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['answer_options'] as FormArray;
    const newAnswerIndex = oldAnswerIndex + 1;
    if (newAnswerIndex === control.length) {
      return;
    }
    const movingAnswer = control.at(newAnswerIndex);
    const reverseMovingAnswer = control.at(oldAnswerIndex);
    control.setControl(oldAnswerIndex, movingAnswer);
    control.setControl(newAnswerIndex, reverseMovingAnswer);
  }

  removeAnswer(questionIndex: number, answerIndex: number): void {
    // remove AnswerOption from the list
    const control = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['answer_options'] as FormArray;
    control.removeAt(answerIndex);
  }

  addValue(
    questionIndex: number,
    answerIndex: number,
    value?: string,
    coded_value?: number,
    is_notable?: boolean
  ): void {
    const text = value ? value : '';
    const code = coded_value !== undefined ? coded_value : null;
    const notable = is_notable !== undefined ? is_notable : false;
    const groupControl = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).controls[answerIndex] as FormGroup;

    (groupControl.controls['values'] as FormArray).push(
      new FormGroup({
        value: new FormControl(text, [Validators.required, this.checkValue]),
        value_coded: new FormControl(
          {
            value: code,
            disabled: (groupControl.controls['coding_enable'] as FormArray)
              .value
              ? false
              : true,
          },
          [Validators.required]
        ),
        is_notable: new FormControl(notable),
      })
    );
  }

  checkValue(control: AbstractControl): any {
    const valueText = control.value.toString();
    if (valueText && valueText.indexOf(';') === -1) {
      return null;
    } else {
      return { checkValue: true };
    }
  }

  setQuestionnaireType(): void {
    switch (this.myForm.value.type) {
      case 'for_probands':
        this.myForm.controls['cycle_unit'].clearValidators();
        this.myForm.controls['cycle_unit'].setValue(null);
        this.myForm.controls['cycle_amount'].setValue(null);
        this.myForm.controls['activate_after_days'].setValue(null);
        this.myForm.controls['deactivate_after_days'].setValue(null);
        this.myForm.controls['finalises_after_days'].setValue(5);
        this.myForm.controls['expires_after_days'].setValue(2);
        this.myForm.controls['notification_tries'].setValue(null);
        this.myForm.controls['notification_tries'].updateValueAndValidity();
        this.setNotificationControls();
        break;
      case 'for_research_team':
        this.myForm.controls['cycle_unit'].clearValidators();
        this.myForm.controls['cycle_unit'].setValue('once');
        this.myForm.controls['cycle_amount'].setValue(1);
        this.myForm.controls['activate_after_days'].setValue(0);
        this.myForm.controls['deactivate_after_days'].setValue(999999);
        this.myForm.controls['finalises_after_days'].setValue(999999);
        this.myForm.controls['expires_after_days'].setValue(999999);
        this.myForm.controls['notification_tries'].setValue(0);
        this.myForm.controls['notification_tries'].updateValueAndValidity();
        this.setNotificationControls();
        break;
    }
  }

  removeItem(
    questionIndex: number,
    answerIndex: number,
    valueIndex: number
  ): void {
    // remove value from the list
    const control = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['values'] as FormArray;
    control.removeAt(valueIndex);
  }

  checkCycleUnit(): void {
    if (this.myForm.value.cycle_unit === 'once') {
      this.myForm.controls['cycle_amount'].clearValidators();
      this.myForm.controls['cycle_amount'].setValue(1);
      this.myForm.controls['cycle_amount'].updateValueAndValidity();
      (
        this.myForm.get('deactivate_after_days') as FormControl
      ).clearValidators();
      this.myForm.controls['deactivate_after_days'].setValue(1);
      this.myForm.controls['deactivate_after_days'].updateValueAndValidity();
    } else {
      switch (this.myForm.value.cycle_unit) {
        case 'hour':
          this.unitValue = 1 / 24;
          break;
        case 'day':
          this.unitValue = 1;
          break;
        case 'week':
          this.unitValue = 7;
          break;
        case 'month':
          this.unitValue = 30;
          break;
      }
      this.deactivate_min_days = Math.round(
        this.myForm.value.cycle_amount * this.unitValue
      );
      this.translationData.deactivate_min_days =
        this.deactivate_min_days.toString();
      (
        this.myForm.get('deactivate_after_days') as FormControl
      ).clearValidators();
      (this.myForm.get('deactivate_after_days') as FormControl).setValidators([
        Validators.min(this.deactivate_min_days),
        Validators.required,
      ]);
      this.myForm.controls['deactivate_after_days'].updateValueAndValidity();
    }
    if (this.myForm.value.cycle_unit !== 'hour') {
      this.myForm.controls['cycle_per_day'].setValue(null);
      this.myForm.controls['cycle_first_hour'].setValue(null);
    }
  }

  setDeactivateMinDays(): void {
    this.deactivate_min_days = Math.round(
      this.myForm.value.cycle_amount * this.unitValue
    );
    this.translationData.deactivate_min_days =
      this.deactivate_min_days.toString();
    (this.myForm.get('deactivate_after_days') as FormControl).clearValidators();
    (this.myForm.get('deactivate_after_days') as FormControl).setValidators([
      Validators.min(this.deactivate_min_days),
      Validators.required,
    ]);
    this.myForm.controls['deactivate_after_days'].updateValueAndValidity();
  }

  checkAnswerType(
    questionIndex: number,
    answerIndex: number,
    isValueFromServer: boolean
  ): void {
    const control = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['answer_options'] as FormArray;
    const control_coding = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['coding_enable'] as FormControl;
    const currentId = control.at(answerIndex).value.current_answer_type_id;
    const id = control.at(answerIndex).value.answer_type_id;
    if (id === 1 || id === 2) {
      control_coding.setValue(true);
    }

    const controlValues = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['values'] as FormArray;
    if (id !== currentId) {
      while (controlValues.length) {
        controlValues.removeAt(0);
      }
      if (!isValueFromServer) {
        if (id === 1) {
          this.addValue(questionIndex, answerIndex);
          this.addValue(questionIndex, answerIndex);
        } else if (id === 2) {
          this.addValue(
            questionIndex,
            answerIndex,
            this.translate.instant('QUESTIONNAIRE_FORSCHER.NO_ANSWER')
          );
          this.addValue(questionIndex, answerIndex);
          this.addValue(questionIndex, answerIndex);
        }
      }
    }
    (
      (control.controls[answerIndex] as FormGroup).get(
        'current_answer_type_id'
      ) as FormControl
    ).setValue(id);
  }

  removeQuestionnaireCondition(): void {
    this.showQuestionnaireCondition = false;
    this.myForm.removeControl('condition');
    this.selectedQuestionnaireIndex = undefined;
    this.selectedQuestionIndex = undefined;
    this.selectedAnswerOptionsIndex = undefined;
    (this.condition_type = undefined),
      (this.condition_questionnaire_id = undefined);
    this.condition_answer_option_id = undefined;
    this.condition_question_id = undefined;
    this.condition_operand = undefined;
    this.condition_value = undefined;
    this.condition_link = undefined;
    this.needToSentQuestionnaire = false;
  }

  /**
   * Add condition to the mein question
   */
  addQuestionnaireCondition(): void {
    this.myForm.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(
          this.condition_type,
          Validators.required
        ),
        condition_target_questionnaire: new FormControl(
          this.condition_questionnaire_id,
          Validators.required
        ),
        condition_target_answer_option: new FormControl(
          this.condition_answer_option_id,
          Validators.required
        ),
        condition_question_id: new FormControl(
          this.condition_question_id,
          Validators.required
        ),
        condition_operand: new FormControl(
          this.condition_operand,
          Validators.required
        ),
        condition_value: new FormControl(
          this.condition_value,
          Validators.required
        ),
        condition_link: new FormControl(
          this.condition_link,
          Validators.required
        ),
      })
    );
    this.showQuestionnaireCondition = true;
    this.myForm.controls['condition_error'].setValue(undefined);
  }

  /**
   * Add Condition to question (Frage)
   * @param questionIndex index of the question (Frage)
   * @param question (Frage)
   */
  addQuestionCondition(questionIndex: number, question?: Question): void {
    const questionControl = (this.myForm.controls['questions'] as FormArray)
      .controls[questionIndex] as FormGroup;
    const condition_type =
      question && question.condition ? question.condition.condition_type : null;
    const condition_questionnaire_id =
      question && question.condition
        ? question.condition.condition_target_questionnaire
        : null;
    const condition_questionnaire_version =
      question && question.condition
        ? question.condition.condition_target_questionnaire_version
        : null;
    const condition_answer_option_id =
      question && question.condition
        ? question.condition.condition_target_answer_option
        : null;
    const condition_target_question_pos = question
      ? question.condition.condition_target_question_pos
      : null;
    const condition_target_answer_option_pos = question
      ? question.condition.condition_target_answer_option_pos
      : null;
    const condition_operand =
      question && question.condition
        ? question.condition.condition_operand
        : null;
    let condition_value: any =
      question && question.condition
        ? question.condition.condition_value
        : null;
    const condition_link =
      question && question.condition ? question.condition.condition_link : null;
    let condition_question_id;

    if (question) {
      this.setSelectedConditionTypeQuestionCondition(
        questionIndex,
        condition_type
      );
      const questionnairesForQuestionConditionValue = (
        questionControl.controls['tmp_for_condition'] as FormGroup
      ).controls['questionnairesForQuestionCondition'].value;
      if (questionnairesForQuestionConditionValue) {
        questionnairesForQuestionConditionValue.forEach(
          (questionnaireResponse, questionnaireIndex) => {
            if (
              questionnaireResponse.id === condition_questionnaire_id &&
              (condition_questionnaire_id === -1 ||
                questionnaireResponse.version ===
                  condition_questionnaire_version)
            ) {
              this.setSelectedQuestionnaireIndexQuestionCondition(
                questionIndex,
                questionnaireIndex
              );
            }
            questionnaireResponse.questions.forEach(
              (questionFromList, questionIndexFromList) => {
                questionFromList.answer_options.forEach(
                  (answerOptionFromList, answerOptionIndexFromList) => {
                    if (
                      (questionnaireResponse.id !== -1 &&
                        answerOptionFromList.id ===
                          condition_answer_option_id) ||
                      (questionnaireResponse.id === -1 &&
                        condition_target_question_pos ===
                          questionFromList.position &&
                        condition_target_answer_option_pos ===
                          answerOptionFromList.position)
                    ) {
                      if (answerOptionFromList.answer_type_id === 5) {
                        condition_value = new Date(condition_value);
                      } else if (
                        answerOptionFromList.answer_type_id === 1 ||
                        answerOptionFromList.answer_type_id === 2
                      ) {
                        condition_value = condition_value.toString().split(';');
                      }
                      this.setSelectedQuestionIndexQuestionCondition(
                        questionIndex,
                        questionIndexFromList
                      );
                      this.setSelectedAnswerOptionsIndexQuestionCondition(
                        questionIndex,
                        answerOptionIndexFromList
                      );
                      condition_question_id = answerOptionFromList.question_id
                        ? answerOptionFromList.question_id
                        : -1;
                    }
                  }
                );
              }
            );
          }
        );
      }
    }

    questionControl.addControl(
      'condition',
      new FormGroup({
        condition_type: new FormControl(condition_type, Validators.required),
        condition_target_questionnaire: new FormControl(
          this.isImportedQuestionnaire && condition_questionnaire_id === -1
            ? condition_questionnaire_id
            : condition_questionnaire_id +
              '-' +
              condition_questionnaire_version,
          Validators.required
        ),
        condition_target_answer_option: new FormControl(
          condition_answer_option_id,
          Validators.required
        ),
        condition_target_question_pos: new FormControl(
          condition_target_question_pos
        ),
        condition_target_answer_option_pos: new FormControl(
          condition_target_answer_option_pos
        ),
        condition_question_id: new FormControl(condition_question_id),
        condition_operand: new FormControl(
          condition_operand,
          Validators.required
        ),
        condition_value: new FormControl(condition_value, Validators.required),
        condition_link: new FormControl(condition_link, Validators.required),
      })
    );
    questionControl.controls['has_condition'].setValue(true);
    questionControl.controls['condition_error'].setValue(undefined);
  }

  /**
   * Removes condition of a question (Frage)
   * @param questionIndex Index of the question you want to remove condition
   */
  removeQuestionCondition(questionIndex: number): void {
    const questionControl = (this.myForm.controls['questions'] as FormArray)
      .controls[questionIndex] as FormGroup;
    questionControl.removeControl('condition');
    questionControl.controls['has_condition'].setValue(false);
    (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
      'questionMessageNeedToSentQuestionnaire'
    ].setValue(false);
    (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
      'selectedConditionTypeQuestion'
    ].setValue(undefined);
    (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
      'selectedQuestionnaireIndexQuestion'
    ].setValue(undefined);
    (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
      'selectedQuestionIndexQuestion'
    ].setValue(undefined);
    (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
      'selectedAnswerOptionsIndexQuestion'
    ].setValue(undefined);
    if (
      (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
        'condition_link'
      ]
    ) {
      (questionControl.controls['tmp_for_condition'] as FormGroup).controls[
        'condition_link'
      ].setValue(undefined);
    }
  }

  removeAnswerOptionCondition(
    questionIndex: number,
    answerIndex: number
  ): void {
    const answerOptionControl = (
      (
        (this.myForm.controls['questions'] as FormArray).controls[
          questionIndex
        ] as FormGroup
      ).controls['answer_options'] as FormArray
    ).controls[answerIndex] as FormGroup;
    answerOptionControl.controls['has_condition'].setValue(false);
    answerOptionControl.removeControl('condition');

    const answerOptionTmpConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    answerOptionTmpConditionControl.controls[
      'answerOptionMessageNeedToSentQuestionnaire'
    ].setValue(false);
    answerOptionTmpConditionControl.controls[
      'selectedConditionTypeAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls[
      'selectedQuestionnaireIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls[
      'selectedQuestionIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls['condition_link'].setValue(
      undefined
    );
  }

  setNotificationControls(): void {
    if ((this.myForm.get('notification_tries') as FormControl).value === 0) {
      this.myForm.controls['notification_title'].clearValidators();
      this.myForm.controls['notification_weekday'].clearValidators();
      this.myForm.controls['notification_interval'].clearValidators();
      this.myForm.controls['notification_interval_unit'].clearValidators();
      this.myForm.controls['notification_body_new'].clearValidators();
      this.myForm.controls['notification_body_in_progress'].clearValidators();
      this.myForm.controls['notification_title'].setValue('');
      this.myForm.controls['notification_weekday'].setValue('');
      this.myForm.controls['notification_interval'].setValue(0);
      this.myForm.controls['notification_interval_unit'].setValue('');
      this.myForm.controls['notification_body_new'].setValue('');
      this.myForm.controls['notification_body_in_progress'].setValue('');
    } else {
      this.myForm.controls['notification_title'].setValidators(
        Validators.required
      );
      this.myForm.controls['notification_weekday'].setValidators(
        Validators.required
      );
      this.myForm.controls['notification_interval'].setValidators(
        Validators.required
      );
      this.myForm.controls['notification_interval_unit'].setValidators(
        Validators.required
      );
      this.myForm.controls['notification_body_new'].setValidators(
        Validators.required
      );
      this.myForm.controls['notification_body_in_progress'].setValidators(
        Validators.required
      );
      this.myForm.controls['notification_title'].updateValueAndValidity();
      this.myForm.controls['notification_weekday'].updateValueAndValidity();
      this.myForm.controls['notification_interval'].updateValueAndValidity();
      this.myForm.controls[
        'notification_interval_unit'
      ].updateValueAndValidity();
      this.myForm.controls['notification_body_new'].updateValueAndValidity();
      this.myForm.controls[
        'notification_body_in_progress'
      ].updateValueAndValidity();
    }
  }

  setSelectedConditionTypeQuestionnaireCondition(conditionType: string): void {
    this.questionnairesForConditionQuestionnaire = this.questionnaires;
    if (this.currentQuestionnaire != null) {
      this.questionnairesForConditionQuestionnaire.forEach(
        (questionnaireResponse, questionnaireIndex) => {
          if (this.currentQuestionnaire.id === questionnaireResponse.id) {
            this.questionnairesForConditionQuestionnaire.splice(
              questionnaireIndex,
              1
            );
          }
        }
      );
    }
    this.selectedConditionType = true;
    this.needToSentQuestionnaire = false;

    this.selectedQuestionnaireIndex = undefined;
    this.selectedQuestionIndex = undefined;
    this.selectedAnswerOptionsIndex = undefined;
  }

  setSelectedConditionTypeQuestionCondition(
    questionIndex: number,
    conditionType: string
  ): void {
    const questionTmpConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const questionConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['condition'] as FormGroup;

    if (questionConditionControl !== undefined) {
      questionConditionControl.controls[
        'condition_target_questionnaire'
      ].setValue(null);
      questionConditionControl.controls['condition_question_id'].setValue(null);
      questionConditionControl.controls[
        'condition_target_answer_option'
      ].setValue(null);
      questionConditionControl.controls['condition_operand'].setValue(null);
      questionConditionControl.controls['condition_value'].setValue(null);
    }

    if (conditionType === 'external') {
      questionTmpConditionControl.controls[
        'questionnairesForQuestionCondition'
      ].setValue(this.questionnaires);
      questionTmpConditionControl.controls[
        'questionMessageNeedToSentQuestionnaire'
      ].setValue(false);
      questionTmpConditionControl.controls[
        'selectedConditionTypeQuestion'
      ].setValue(true);
      if (this.currentQuestionnaire != null) {
        questionTmpConditionControl.controls[
          'questionnairesForQuestionCondition'
        ].value.forEach((questionnaireResponse, questionnaireIndex) => {
          if (this.currentQuestionnaire.id === questionnaireResponse.id) {
            questionTmpConditionControl.controls[
              'questionnairesForQuestionCondition'
            ].value.splice(questionnaireIndex, 1);
          }
        });
      }
    } else {
      if (this.currentQuestionnaire != null) {
        questionTmpConditionControl.controls[
          'questionnairesForQuestionCondition'
        ].setValue([this.currentQuestionnaire]);
        questionTmpConditionControl.controls[
          'questionMessageNeedToSentQuestionnaire'
        ].setValue(false);
        questionTmpConditionControl.controls[
          'selectedConditionTypeQuestion'
        ].setValue(true);
      } else {
        questionTmpConditionControl.controls[
          'questionMessageNeedToSentQuestionnaire'
        ].setValue(true);
        questionTmpConditionControl.controls[
          'selectedConditionTypeQuestion'
        ].setValue(undefined);
      }
    }

    questionTmpConditionControl.controls[
      'selectedQuestionnaireIndexQuestion'
    ].setValue(undefined);
    questionTmpConditionControl.controls[
      'selectedQuestionIndexQuestion'
    ].setValue(undefined);
    questionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexQuestion'
    ].setValue(undefined);
    questionTmpConditionControl.updateValueAndValidity();
  }

  setSelectedConditionTypeAnswerOptionCondition(
    questionIndex: number,
    answerIndex: number,
    conditionType: string
  ): void {
    const answerOptionTmpConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const answerOptionConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['condition'] as FormGroup;

    if (answerOptionConditionControl !== undefined) {
      answerOptionConditionControl.controls[
        'condition_target_questionnaire'
      ].setValue(null);
      answerOptionConditionControl.controls['condition_question_id'].setValue(
        null
      );
      answerOptionConditionControl.controls[
        'condition_target_answer_option'
      ].setValue(null);
      answerOptionConditionControl.controls['condition_operand'].setValue(null);
      answerOptionConditionControl.controls['condition_value'].setValue(null);
    }

    if (conditionType === 'external') {
      answerOptionTmpConditionControl.controls[
        'questionnairesForAnswerOptionCondition'
      ].setValue(this.questionnaires);
      answerOptionTmpConditionControl.controls[
        'answerOptionMessageNeedToSentQuestionnaire'
      ].setValue(false);
      answerOptionTmpConditionControl.controls[
        'selectedConditionTypeAnswerOption'
      ].setValue(true);
      if (this.currentQuestionnaire != null) {
        answerOptionTmpConditionControl.controls[
          'questionnairesForAnswerOptionCondition'
        ].value.forEach((questionnaireResponse, questionnaireIndex) => {
          if (this.currentQuestionnaire.id === questionnaireResponse.id) {
            answerOptionTmpConditionControl.controls[
              'questionnairesForAnswerOptionCondition'
            ].value.splice(questionnaireIndex, 1);
          }
        });
      }
    } else {
      if (this.currentQuestionnaire != null) {
        const currentQuestionnaireValue = JSON.parse(
          JSON.stringify(this.currentQuestionnaire)
        );
        answerOptionTmpConditionControl.controls[
          'questionnairesForAnswerOptionCondition'
        ].setValue([currentQuestionnaireValue]);
        if (conditionType === 'internal_this') {
          const currentQuestionPosition = (
            (
              (this.myForm.controls['questions'] as FormArray).controls[
                questionIndex
              ] as FormGroup
            ).controls['position'] as FormControl
          ).value;
          const currentAnswerOptionPosition = (
            (
              (
                (
                  (this.myForm.controls['questions'] as FormArray).controls[
                    questionIndex
                  ] as FormGroup
                ).controls['answer_options'] as FormArray
              ).controls[answerIndex] as FormGroup
            ).controls['position'] as FormControl
          ).value;
          answerOptionTmpConditionControl.controls[
            'questionnairesForAnswerOptionCondition'
          ].value[0].questions.forEach((question, question_index) => {
            if (question.position === currentQuestionPosition) {
              question.answer_options.forEach(
                (answer_option, answer_option_index) => {
                  if (answer_option.position === currentAnswerOptionPosition) {
                    question.answer_options.splice(answer_option_index, 1);
                  }
                }
              );
            }
          });
        }
        answerOptionTmpConditionControl.controls[
          'answerOptionMessageNeedToSentQuestionnaire'
        ].setValue(false);
        answerOptionTmpConditionControl.controls[
          'selectedConditionTypeAnswerOption'
        ].setValue(true);
      } else {
        answerOptionTmpConditionControl.controls[
          'answerOptionMessageNeedToSentQuestionnaire'
        ].setValue(true);
        answerOptionTmpConditionControl.controls[
          'selectedConditionTypeAnswerOption'
        ].setValue(undefined);
      }
    }
    answerOptionTmpConditionControl.controls[
      'selectedQuestionnaireIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls[
      'selectedQuestionIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.updateValueAndValidity();
  }

  setSelectedQuestionnaireIndexQuestionnaireCondition(index: number): void {
    this.selectedQuestionnaireIndex = index;
    this.selectedQuestionIndex = undefined;
    this.selectedAnswerOptionsIndex = undefined;
  }

  setSelectedQuestionIndexQuestionnaireCondition(index: number): void {
    this.selectedQuestionIndex = index;
    this.selectedAnswerOptionsIndex = undefined;
  }

  setSelectedAnswerOptionsIndexQuestionnaireCondition(index: number): void {
    this.selectedAnswerOptionsIndex = index;
  }

  setSelectedQuestionnaireIndexQuestionCondition(
    questionIndex: number,
    index: number
  ): void {
    const questionTmpConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const questionConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['condition'] as FormGroup;
    if (questionConditionControl !== undefined) {
      questionConditionControl.controls['condition_question_id'].setValue(null);
      questionConditionControl.controls[
        'condition_target_answer_option'
      ].setValue(null);
      questionConditionControl.controls['condition_operand'].setValue(null);
      questionConditionControl.controls['condition_value'].setValue(null);
    }
    questionTmpConditionControl.controls[
      'selectedQuestionnaireIndexQuestion'
    ].setValue(index);
    questionTmpConditionControl.controls[
      'selectedQuestionIndexQuestion'
    ].setValue(undefined);
    questionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexQuestion'
    ].setValue(undefined);
  }

  setSelectedQuestionIndexQuestionCondition(
    questionIndex: number,
    index: number
  ): void {
    const questionTmpConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const questionConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['condition'] as FormGroup;
    if (questionConditionControl !== undefined) {
      questionConditionControl.controls[
        'condition_target_answer_option'
      ].setValue(null);
      questionConditionControl.controls['condition_operand'].setValue(null);
      questionConditionControl.controls['condition_value'].setValue(null);
    }
    questionTmpConditionControl.controls[
      'selectedQuestionIndexQuestion'
    ].setValue(index);
    questionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexQuestion'
    ].setValue(undefined);
  }

  setSelectedAnswerOptionsIndexQuestionCondition(
    questionIndex: number,
    index: number
  ): void {
    const questionTmpConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const questionConditionControl = (
      (this.myForm.controls['questions'] as FormArray).controls[
        questionIndex
      ] as FormGroup
    ).controls['condition'] as FormGroup;
    if (questionConditionControl !== undefined) {
      questionConditionControl.controls['condition_operand'].setValue(null);
      questionConditionControl.controls['condition_value'].setValue(null);
    }
    questionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexQuestion'
    ].setValue(index);
  }

  setSelectedQuestionnaireIndexAnswerOptionCondition(
    questionIndex: number,
    answerIndex: number,
    index: number
  ): void {
    const answerOptionTmpConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const answerOptionConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['condition'] as FormGroup;
    if (answerOptionConditionControl !== undefined) {
      answerOptionConditionControl.controls['condition_question_id'].setValue(
        null
      );
      answerOptionConditionControl.controls[
        'condition_target_answer_option'
      ].setValue(null);
      answerOptionConditionControl.controls['condition_operand'].setValue(null);
      answerOptionConditionControl.controls['condition_value'].setValue(null);
    }
    answerOptionTmpConditionControl.controls[
      'selectedQuestionnaireIndexAnswerOption'
    ].setValue(index);
    answerOptionTmpConditionControl.controls[
      'selectedQuestionIndexAnswerOption'
    ].setValue(undefined);
    answerOptionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexAnswerOption'
    ].setValue(undefined);
  }

  setSelectedQuestionIndexAnswerOptionCondition(
    questionIndex: number,
    answerIndex: number,
    index: number
  ): void {
    const answerOptionTmpConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const answerOptionConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['condition'] as FormGroup;
    if (answerOptionConditionControl !== undefined) {
      answerOptionConditionControl.controls[
        'condition_target_answer_option'
      ].setValue(null);
      answerOptionConditionControl.controls['condition_operand'].setValue(null);
      answerOptionConditionControl.controls['condition_value'].setValue(null);
    }
    answerOptionTmpConditionControl.controls[
      'selectedQuestionIndexAnswerOption'
    ].setValue(index);
    answerOptionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexAnswerOption'
    ].setValue(undefined);
  }

  setSelectedAnswerOptionsIndexAnswerOptionCondition(
    questionIndex: number,
    answerIndex: number,
    index: number
  ): void {
    const answerOptionTmpConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['tmp_for_condition'] as FormGroup;
    const answerOptionConditionControl = (
      (
        (
          (this.myForm.controls['questions'] as FormArray).controls[
            questionIndex
          ] as FormGroup
        ).controls['answer_options'] as FormArray
      ).controls[answerIndex] as FormGroup
    ).controls['condition'] as FormGroup;

    if (answerOptionConditionControl !== undefined) {
      answerOptionConditionControl.controls['condition_operand'].setValue(null);
      answerOptionConditionControl.controls['condition_value'].setValue(null);
    }
    answerOptionTmpConditionControl.controls[
      'selectedAnswerOptionsIndexAnswerOption'
    ].setValue(index);
  }

  onDeactivate(): void {
    this.dialog
      .open(DialogYesNoComponent, {
        width: '500px',
        data: {
          content: 'QUESTIONNAIRE_FORSCHER.DEACTIVATION_CONFIRMATION_HINT',
        },
      })
      .afterClosed()
      .pipe(filter((result) => result === 'yes'))
      .subscribe(() => this.deactivateQuestionnaire());
  }

  async deactivateQuestionnaire(): Promise<void> {
    this.isLoading = true;
    try {
      this.currentQuestionnaire =
        await this.questionnaireService.deactivateQuestionnaire(
          this.study_id,
          this.questionnaireId,
          this.questionnaireVersion
        );
      this.changeDetectorRef.detectChanges();
    } catch (error) {
      this.alertService.errorObject(error);
    }
    this.isLoading = false;
  }

  onCancel(): void {
    this.router.navigate(['/questionnaires/admin']);
  }

  getAnswerOptionPosition(
    answerOptionId,
    questionnaire
  ): { answerOptionPosition: any; questionPosition: any } {
    for (const question of questionnaire.questions) {
      for (const answerOption of question.answer_options) {
        if (answerOption.id === answerOptionId) {
          return {
            answerOptionPosition: answerOption.position,
            questionPosition: question.position,
          };
        }
      }
    }
    return { answerOptionPosition: undefined, questionPosition: undefined };
  }

  generateExportDataFrom(form: FormGroup): any {
    const questionnaireRequest = JSON.parse(JSON.stringify(form.value));

    // HEADER
    questionnaireRequest.id = -1;

    if (questionnaireRequest.condition) {
      questionnaireRequest.condition.condition_question_id = undefined;

      if (questionnaireRequest.condition.condition_link === null) {
        questionnaireRequest.condition.condition_link = undefined;
      }

      if (questionnaireRequest.condition.condition_value instanceof Array) {
        questionnaireRequest.condition.condition_value =
          questionnaireRequest.condition.condition_value.join(';');
      } else {
        questionnaireRequest.condition.condition_value =
          questionnaireRequest.condition.condition_value.toString();
      }
      if (questionnaireRequest.condition.condition_type === 'external') {
        questionnaireRequest.condition_postview =
          this.addExternalConditionPostview(questionnaireRequest.condition);
      }
    }

    // generate conditions position values
    let positions;
    for (const question of questionnaireRequest.questions) {
      if (question.condition) {
        positions = this.getAnswerOptionPosition(
          question.condition.condition_target_answer_option,
          questionnaireRequest
        );
        question.condition.condition_target_question_pos =
          positions.questionPosition;
        question.condition.condition_target_answer_option_pos =
          positions.answerOptionPosition;
        if (question.condition.condition_type === 'external') {
          question.condition_postview = this.addExternalConditionPostview(
            question.condition
          );
        }
      }
      for (const answer_option of question.answer_options) {
        if (answer_option.condition) {
          positions = this.getAnswerOptionPosition(
            answer_option.condition.condition_target_answer_option,
            questionnaireRequest
          );
          answer_option.condition.condition_target_question_pos =
            positions.questionPosition;
          answer_option.condition.condition_target_answer_option_pos =
            positions.answerOptionPosition;
          if (answer_option.condition.condition_type === 'external') {
            answer_option.condition_postview =
              this.addExternalConditionPostview(answer_option.condition);
          }
        }
      }
    }

    // QUESTIONS
    let question_position = 1;
    for (const question of questionnaireRequest.questions) {
      if (question.tmp_for_condition) {
        question.tmp_for_condition = undefined;
      }

      question.has_condition = undefined;
      if (question.condition) {
        question.condition.condition_question_id = undefined;

        if (question.condition.condition_link === null) {
          question.condition.condition_link = undefined;
        }

        if (question.condition.condition_type !== 'external') {
          question.condition.condition_target_questionnaire = -1;
          question.condition.condition_target_answer_option = -1;
        }

        if (question.condition.condition_value instanceof Array) {
          question.condition.condition_value =
            question.condition.condition_value.join(';');
        } else {
          question.condition.condition_value =
            question.condition.condition_value.toString();
        }
      }

      question.position = question_position;
      question.id = -1;
      question_position++;

      // ANSWER_OPTIONS
      let answer_option_position = 1;
      for (const answer_option of question.answer_options) {
        answer_option.tmp_for_condition = undefined;
        answer_option.has_condition = undefined;

        answer_option.current_answer_type_id = undefined;
        answer_option.coding_enable = undefined;
        answer_option.is_condition_target = undefined;

        if (answer_option.condition) {
          answer_option.condition.condition_question_id = undefined;

          if (answer_option.condition.condition_type !== 'external') {
            answer_option.condition.condition_target_questionnaire = -1;
            answer_option.condition.condition_target_answer_option = -1;
          }

          if (answer_option.condition.condition_link === null) {
            answer_option.condition.condition_link = undefined;
          }
          if (answer_option.condition.condition_value instanceof Array) {
            answer_option.condition.condition_value =
              answer_option.condition.condition_value.join(';');
          }

          if (answer_option.condition.condition_value instanceof Number) {
            answer_option.condition.condition_value =
              answer_option.condition.condition_value.toString();
          }
        }

        for (const value of answer_option.values) {
          answer_option.values_code.push({ value: value.value_coded });
          value.value_coded = undefined;
        }

        answer_option.position = answer_option_position;
        answer_option.id = -1;
        answer_option_position++;
      }
    }

    return questionnaireRequest;
  }

  addExternalConditionPostview(condition): void {
    const postviewCondition: any = {};
    const foundQuestionnaire = this.questionnaires.find((questionnaire) => {
      return (
        questionnaire.id + '-' + questionnaire.version ===
        condition.condition_target_questionnaire
      );
    });

    let foundAnswerOption = null;
    const foundQuestion = foundQuestionnaire.questions.find((question) => {
      foundAnswerOption = question.answer_options.find((answer_option) => {
        return answer_option.id === condition.condition_target_answer_option;
      });
      return foundAnswerOption !== null && foundAnswerOption !== undefined;
    });

    postviewCondition.condition_target_questionnaire_name =
      foundQuestionnaire.name;
    postviewCondition.condition_target_question_text = foundQuestion.text;
    postviewCondition.condition_target_answer_option_pos =
      foundAnswerOption.position;
    postviewCondition.condition_operand = condition.condition_operand;
    postviewCondition.condition_value = condition.condition_value;
    postviewCondition.condition_link = condition.condition_link;

    return postviewCondition;
  }

  /**
   * Generate questionnaire request data from Form
   *
   * @returns questionnaireRequest
   */
  generateQuestionnaireRequestDataFrom(form: FormGroup): Questionnaire {
    (this.myForm.controls['questions'] as FormArray).value.forEach(
      (question, questionIndex) => {
        const questionController = (
          this.myForm.controls['questions'] as FormArray
        ).controls[questionIndex] as FormGroup;

        let questionConditionLink = null;
        if (questionController.controls['condition'] as FormGroup) {
          questionConditionLink = (
            questionController.controls['condition'] as FormGroup
          ).controls['condition_link'];

          if (questionConditionLink.value === null) {
            questionConditionLink.disable();
          }
        }
        /*
         *Disable controller that should not be send with request
         */
        // Disable condition link if data is null
        if (questionController.controls['has_condition'] !== undefined) {
          questionController.controls['has_condition'].disable();
        }
        if (
          (questionController.controls['condition'] as FormGroup) !== undefined
        ) {
          (questionController.controls['condition'] as FormGroup).controls[
            'condition_question_id'
          ].disable();
        }
        questionController.controls['tmp_for_condition'].disable();
        if (questionController.controls['id'].value == null) {
          questionController.controls['id'].disable();
        }

        const questions = this.myForm.controls['questions'] as FormArray;

        // For every subquestion (Unterfrage) in the form
        (
          (questions.controls[questionIndex] as FormGroup).controls[
            'answer_options'
          ] as FormArray
        ).value.forEach((answer, answerIndex) => {
          const answerOptionControler = (
            (
              (this.myForm.controls['questions'] as FormArray).controls[
                questionIndex
              ] as FormGroup
            ).controls['answer_options'] as FormArray
          ).controls[answerIndex] as FormGroup;
          answerOptionControler.removeControl('current_answer_type_id');
          answerOptionControler.controls['coding_enable'].disable();

          if (answerOptionControler.controls['has_condition'] !== undefined) {
            answerOptionControler.controls['has_condition'].disable();
          }
          if (
            answerOptionControler.controls['is_condition_target'] !== undefined
          ) {
            answerOptionControler.controls['is_condition_target'].disable();
          }
          answerOptionControler.controls['tmp_for_condition'].disable();
          if (
            (answerOptionControler.controls['condition'] as FormGroup) !==
            undefined
          ) {
            (answerOptionControler.controls['condition'] as FormGroup).controls[
              'condition_question_id'
            ].disable();
          }
        });
      }
    );

    if (form.controls['condition'] as FormGroup) {
      const questionnaireConditionLink = (
        form.controls['condition'] as FormGroup
      ).controls['condition_link'];

      if (
        questionnaireConditionLink &&
        questionnaireConditionLink.value === null
      ) {
        questionnaireConditionLink.disable();
      }
    }

    // Disable condition_question_id because it should not be send with request
    if ((form.controls['condition'] as FormGroup) !== undefined) {
      (form.controls['condition'] as FormGroup).controls[
        'condition_question_id'
      ].disable();
    }
    const questionnaireRequest = form.value;

    questionnaireRequest.activate_at_date = this.activate_at_date;

    if (questionnaireRequest.condition) {
      //
      if (questionnaireRequest.condition.condition_value instanceof Array) {
        questionnaireRequest.condition.condition_value =
          questionnaireRequest.condition.condition_value.join(';');
      } else {
        questionnaireRequest.condition.condition_link = undefined;
        questionnaireRequest.condition.condition_value =
          questionnaireRequest.condition.condition_value.toString();
      }
      if (
        questionnaireRequest.condition.condition_target_questionnaire &&
        questionnaireRequest.condition.condition_target_questionnaire.split
      ) {
        questionnaireRequest.condition.condition_target_questionnaire =
          questionnaireRequest.condition.condition_target_questionnaire.split(
            '-'
          );
        [
          questionnaireRequest.condition.condition_target_questionnaire,
          questionnaireRequest.condition.condition_target_questionnaire_version,
        ] = questionnaireRequest.condition.condition_target_questionnaire;
      }
    }

    questionnaireRequest.questions.forEach((question, questionIndex) => {
      question.position = questionIndex + 1;

      // Convert Condition value to string before sending them
      if (question.condition) {
        if (question.condition.condition_value instanceof Array) {
          question.condition.condition_value =
            question.condition.condition_value.join(';');
        } else {
          question.condition.condition_link = undefined;
          question.condition.condition_value =
            question.condition.condition_value.toString();
        }
        if (
          question.condition.condition_target_questionnaire &&
          question.condition.condition_target_questionnaire.split
        ) {
          question.condition.condition_target_questionnaire =
            question.condition.condition_target_questionnaire.split('-');
          [
            question.condition.condition_target_questionnaire,
            question.condition.condition_target_questionnaire_version,
          ] = question.condition.condition_target_questionnaire;
        }
      }

      question.answer_options.forEach((answer, answerIndex) => {
        // Convert Condition value to string before sending them if its single or multiple
        if (answer.condition) {
          // Single or multiple answers a from type array.
          if (answer.condition.condition_value instanceof Array) {
            answer.condition.condition_value =
              answer.condition.condition_value.join(';');
          } else {
            answer.condition.condition_link = undefined;
            answer.condition.condition_value =
              answer.condition.condition_value.toString();
          }
          if (
            answer.condition.condition_target_questionnaire &&
            answer.condition.condition_target_questionnaire.split
          ) {
            answer.condition.condition_target_questionnaire =
              answer.condition.condition_target_questionnaire.split('-');
            [
              answer.condition.condition_target_questionnaire,
              answer.condition.condition_target_questionnaire_version,
            ] = answer.condition.condition_target_questionnaire;
          }
        }

        answer.position = answerIndex + 1;
        const values_code: any[] = [];
        const values: any[] = [];
        const is_notable: any[] = [];

        let code_present = false;
        answer.values.forEach((value) => {
          const tmpValue: any = value;
          is_notable.push({ value: tmpValue.is_notable });
          values.push({ value: tmpValue.value });
          values_code.push({ value: tmpValue.value_coded });
          if (tmpValue.value_coded !== null) {
            code_present = true;
          }
        });
        answer.is_notable = is_notable;
        answer.values = values;
        answer.values_code = code_present ? values_code : [];
      });
    });
    return questionnaireRequest;
  }

  onClickExportFragebogen(): void {
    const fragebogenObj = this.generateExportDataFrom(this.myForm);
    const someConditionsWasDeleted = false;

    // Delete all ids
    fragebogenObj.study_id = undefined;

    // Delete all conditions that depends on this questionnaire
    // if (fragebogenObj.condition) {
    //   if (fragebogenObj.condition.condition_type === 'internal_this' || fragebogenObj.condition.condition_type === 'internal_last') {
    //     fragebogenObj.condition = undefined;
    //     someConditionsWasDeleted = true;
    //   }
    // }

    for (const question of fragebogenObj.questions) {
      if (question.condition) {
        // Delete conditions that refers on themselves
        if (
          question.condition.condition_type === 'internal_this' ||
          question.condition.condition_type === 'internal_last'
        ) {
          // question.condition = undefined;
          // someConditionsWasDeleted = true;
        }
      }

      for (const answer_option of question.answer_options) {
        // Delete conditions that refers on themselves
        // if (answer_option.condition) {
        //   if (answer_option.condition.condition_type === 'internal_this' || answer_option.condition.condition_type === 'internal_last') {
        //     answer_option.condition = undefined;
        //     someConditionsWasDeleted = true;
        //   }
        // }

        const values = [];
        const values_code = [];
        const is_notable = [];

        // Value and value_code haben beim abschicken folgnde form values: [{value: "ja"}, {value: "nein"}]
        // Der response hat folgende Form values: ["ja", "nein"]
        // value_codes genau so
        // Deshalb muss man die values and value_codes umwandeln

        for (const value of answer_option.is_notable) {
          is_notable.push(value.value);
        }
        answer_option.is_notable = is_notable;
        for (const value of answer_option.values) {
          values.push(value.value);
        }
        answer_option.values = values;
        for (const value_code of answer_option.values_code) {
          values_code.push(value_code.value);
        }
        answer_option.values_code = values_code;
      }
    }

    if (someConditionsWasDeleted) {
      this.showDialog('QUESTIONNAIRE_FORSCHER.INTERNAL_CONDITIONS_REMOVED');
    }

    this.saveJSON(fragebogenObj, this.currentQuestionnaire.name);
  }

  onClickImportFragebogen(): void {
    let someConditionsWereDeletedAtImport = false;
    const reader = new FileReader();

    // What should happen after document is loaded
    reader.onload = (e) => {
      const fragebogenObj: Questionnaire = JSON.parse(reader.result as string);
      fragebogenObj.active = true;

      if (fragebogenObj.condition) {
        this.fixImportedCondition(fragebogenObj.condition);

        if (this.shouldDeleteCondition(fragebogenObj.condition)) {
          fragebogenObj.condition = undefined;
          fragebogenObj.condition_error = 'reference-not-found';
          someConditionsWereDeletedAtImport = true;
        }
      }

      for (const question of fragebogenObj.questions) {
        if (question.condition) {
          this.fixImportedCondition(question.condition);

          if (this.shouldDeleteCondition(question.condition)) {
            question.condition = undefined;
            question.condition_error = 'reference-not-found';
            someConditionsWereDeletedAtImport = true;
          }
        }

        for (const answer_option of question.answer_options) {
          if (answer_option.condition) {
            this.fixImportedCondition(answer_option.condition);

            if (this.shouldDeleteCondition(answer_option.condition)) {
              answer_option.condition = undefined;
              answer_option.condition_error = 'reference-not-found';
              someConditionsWereDeletedAtImport = true;
            }
          }
        }
      }
      if (someConditionsWereDeletedAtImport) {
        this.showDialog('QUESTIONNAIRE_FORSCHER.SOME_CONDITIONS_REMOVED');
      }
      this.currentQuestionnaire = fragebogenObj;
      this.isImportedQuestionnaire = true;
      this.panelDrag = false;
      this.initForm(fragebogenObj);
    };

    document.getElementById('myFileInputField').click();

    const inputElement = document.getElementById('myFileInputField');

    inputElement.onchange = (e) => {
      const fragebogen = (
        window.document.getElementById('myFileInputField') as HTMLInputElement
      ).files[0];
      if (fragebogen) {
        reader.readAsText(fragebogen);
      }
    };
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    this.activate_at_date = event.value.toDateString();
    this.myForm.controls['activate_at_date'].setValue(event.value);
  }

  fixImportedCondition(condition: any): void {
    if (
      condition.condition_target_questionnaire &&
      condition.condition_target_questionnaire.split
    ) {
      condition.condition_target_questionnaire =
        condition.condition_target_questionnaire.split('-');
      condition.condition_target_questionnaire[0] = parseInt(
        condition.condition_target_questionnaire[0],
        10
      );
      if (condition.condition_target_questionnaire.length === 1) {
        condition.condition_target_questionnaire.push(1);
      } else {
        condition.condition_target_questionnaire[1] = parseInt(
          condition.condition_target_questionnaire[1],
          10
        );
      }
      [
        condition.condition_target_questionnaire,
        condition.condition_target_questionnaire_version,
      ] = condition.condition_target_questionnaire;
    } else if (condition.condition_target_questionnaire) {
      condition.condition_target_questionnaire_version = 1;
    }
    console.dir(condition);
  }

  shouldDeleteCondition(condition: any): boolean {
    let conditionShouldBeDeleted = true;
    const questionnaireID = condition.condition_target_questionnaire;
    const questionnaireVersion =
      condition.condition_target_questionnaire_version;
    const answerOptionID = condition.condition_target_answer_option;

    if (condition.condition_type === 'external') {
      const questionnaireFound = this.questionnaires.find(
        (element) =>
          element.id === questionnaireID &&
          element.version === questionnaireVersion
      );
      if (questionnaireFound) {
        for (const question of questionnaireFound['questions']) {
          const answerOptions = question['answer_options'];

          if (answerOptions) {
            const answerOptionFound = answerOptions.find(
              (element) => element.id === answerOptionID
            );

            if (answerOptionFound) {
              conditionShouldBeDeleted = false;
            }
          }
        }
      }
    } else {
      conditionShouldBeDeleted = false;
    }
    return conditionShouldBeDeleted;
  }

  // Source: https://stackoverflow.com/questions/19721439/download-json-object-as-a-file-from-browser
  // FileSaver.js is a much better option
  saveJSON(data, filename): void {
    if (!data) {
      console.error('No data');
      return;
    }

    if (!filename) {
      filename = 'fragebogen.json';
    } else {
      filename += '.json';
    }

    if (typeof data === 'object') {
      data = JSON.stringify(data, undefined, 4);
    }

    const blob = new Blob([data], { type: 'text/json' });
    const e = document.createEvent('MouseEvents');
    const a = document.createElement('a');

    a.download = filename;
    a.href = window.URL.createObjectURL(blob);
    a.dataset.downloadurl = ['text/json', a.download, a.href].join(':');
    e.initMouseEvent(
      'click',
      true,
      false,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    );
    a.dispatchEvent(e);
  }

  getFormValidationErrors(): number {
    let numOfErr = 0;
    this.fieldsWithErrors = [];

    Object.keys(this.myForm.controls).forEach((key) => {
      if (this.myForm.get(key) instanceof FormArray) {
        (this.myForm.controls[key] as FormArray).value.forEach(
          (keyObject, keyIndex) => {
            const keyController = (this.myForm.controls[key] as FormArray)
              .controls[keyIndex] as FormGroup;
            Object.keys(keyController.controls).forEach((key2) => {
              if (keyController.get(key2) instanceof FormArray) {
                (keyController.controls[key2] as FormArray).value.forEach(
                  (key2Object, key2Index) => {
                    const key2Controller = (
                      keyController.controls[key2] as FormArray
                    ).controls[key2Index] as FormGroup;
                    Object.keys(key2Controller.controls).forEach((key3) => {
                      const controlErrors3: ValidationErrors = (
                        key2Controller.controls[key3] as FormControl
                      ).errors;
                      if (controlErrors3 != null) {
                        Object.keys(controlErrors3).forEach((keyError3) => {
                          this.fieldsWithErrors.push(
                            key +
                              '[' +
                              keyIndex +
                              '].' +
                              key2 +
                              '[' +
                              key2Index +
                              '].' +
                              key3
                          );
                          numOfErr++;
                        });
                      }
                    });
                  }
                );
              }
              const controlErrors2: ValidationErrors = (
                keyController.controls[key2] as FormControl
              ).errors;
              if (controlErrors2 != null) {
                Object.keys(controlErrors2).forEach((keyError2) => {
                  this.fieldsWithErrors.push(
                    key + '[' + keyIndex + '].' + key2
                  );
                  numOfErr++;
                });
              }
            });
          }
        );
      }
      const controlErrors: ValidationErrors = this.myForm.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach((keyError) => {
          this.fieldsWithErrors.push(key);
          numOfErr++;
        });
      }
    });

    return numOfErr;
  }

  getFormValidationErrorsmaster(): number {
    let numOfErr = 0;
    this.fieldsWithErrors = [];

    Object.keys(this.myForm.controls).forEach((key) => {
      if (this.myForm.get(key) instanceof FormArray) {
        (this.myForm.controls[key] as FormArray).value.forEach(
          (keyObject, keyIndex) => {
            const keyController = (this.myForm.controls[key] as FormArray)
              .controls[keyIndex] as FormGroup;
            Object.keys(keyController.controls).forEach((key2) => {
              if (keyController.get(key2) instanceof FormArray) {
                (keyController.controls[key2] as FormArray).value.forEach(
                  (key2Object, key2Index) => {
                    const key2Controller = (
                      keyController.controls[key2] as FormArray
                    ).controls[key2Index] as FormGroup;
                    Object.keys(key2Controller.controls).forEach((key3) => {
                      const controlErrors3: ValidationErrors = (
                        key2Controller.controls[key3] as FormControl
                      ).errors;
                      if (controlErrors3 != null) {
                        Object.keys(controlErrors3).forEach((keyError3) => {
                          this.fieldsWithErrors.push(
                            key +
                              '[' +
                              keyIndex +
                              '].' +
                              key2 +
                              '[' +
                              key2Index +
                              '].' +
                              key3
                          );
                          numOfErr++;
                        });
                      }
                    });
                  }
                );
              }
              const controlErrors2: ValidationErrors = (
                keyController.controls[key2] as FormControl
              ).errors;
              if (controlErrors2 != null) {
                Object.keys(controlErrors2).forEach((keyError2) => {
                  this.fieldsWithErrors.push(
                    key + '[' + keyIndex + '].' + key2
                  );
                  numOfErr++;
                });
              }
            });
          }
        );
      }
      const controlErrors: ValidationErrors = this.myForm.get(key).errors;
      if (controlErrors != null) {
        Object.keys(controlErrors).forEach((keyError) => {
          this.fieldsWithErrors.push(key);
          numOfErr++;
        });
      }
    });

    return numOfErr;
  }

  private showSuccessDialog(message: string): void {
    this.dialog.open(DialogQuestionnaireSuccessComponent, {
      width: '500px',
      data: { data: message },
    });
  }

  private showFailureDialog(message: string): void {
    this.dialog.open(DialogQuestionnaireFailComponent, {
      width: '500px',
      data: { data: message },
    });
  }

  private showDialog(message: string): void {
    this.dialog.open(DialogPopUpComponent, {
      width: '500px',
      data: {
        data: '',
        content: message,
        isSuccess: true,
      },
    });
  }

  /**
   * add string (dat=) in current question text
   *
   * @param questionIndex question index in form
   */
  addCustomVariable(control: FormControl, oField): void {
    let cursorPosition;
    if (oField.selectionStart || oField.selectionStart === '0') {
      cursorPosition = oField.selectionStart;
    }
    const newQuestionText =
      control.value.slice(0, cursorPosition) +
      '(dat=)' +
      control.value.slice(cursorPosition);
    control.setValue(newQuestionText);
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

  onResize(event?): void {
    const width: number = event ? event.target.innerWidth : window.innerWidth;
    if (width <= 700) {
      this.settingsCols = 3;
    } else if (width <= 850) {
      this.settingsCols = 6;
      this.conditionCols = 1;
    } else if (width <= 1000) {
      this.settingsCols = 9;
      this.conditionCols = 2;
    } else if (width <= 1150) {
      this.settingsCols = 12;
      this.conditionCols = 3;
    } else if (width <= 1350) {
      this.conditionCols = 4;
    } else {
      this.settingsCols = 15;
      this.conditionCols = 5;
    }
  }

  preventExpansion(event: Event): void {
    event.stopPropagation();
  }

  dndDrop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(
      this.myForm.controls['questions']['controls'],
      event.previousIndex,
      event.currentIndex
    );
  }

  isUpdateButtonDisabled(): boolean {
    return this.editingStatus && this.publish === 'allaudiences';
  }

  mustNotEmptyTimeAndDayIfEnabled(form: FormGroup): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const assert =
        form.controls['notify_when_not_filled'].value === true &&
        (!form.controls['notify_when_not_filled_time'].value ||
          form.controls['notify_when_not_filled_day'].value === null);
      return assert ? { emptyHourOrDay: true } : null;
    };
  }
}
