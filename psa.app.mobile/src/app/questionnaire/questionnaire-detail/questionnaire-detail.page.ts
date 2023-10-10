/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormControl } from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonSlides,
  ViewWillLeave,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { QuestionnaireClientService } from '../questionnaire-client.service';
import {
  AnswerOption,
  AnswerType,
  Question,
  QuestionnaireInstance,
  QuestionnaireInstanceQueue,
  QuestionnaireStatus,
  Study,
} from '../questionnaire.model';
import {
  FormControlValue,
  QuestionnaireFormService,
} from '../questionnaire-form/questionnaire-form.service';
import { QuestionnaireAnswerValidators } from '../questionnaire-form/questionnaire-answer-validators';
import { QuestionnaireConditionChecker } from '../questionnaire-condition-checker';

@Component({
  selector: 'app-questionnaire-detail',
  templateUrl: './questionnaire-detail.page.html',
  styleUrls: ['./questionnaire-detail.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class QuestionnaireDetailPage
  implements OnInit, OnDestroy, ViewWillLeave
{
  @ViewChild(IonSlides) slides: IonSlides;

  @ViewChild(IonContent) content: IonContent;

  questionnaireInstance: QuestionnaireInstance;

  conditionChecker: QuestionnaireConditionChecker;

  study: Study;

  form: FormArray;

  isLoading = true;

  canGoToPrevious: boolean;
  canGoToNext: boolean;
  canSubmit: boolean;

  currentSlideIndex = 0;

  slidesOptions = { autoHeight: true };

  statusChangesSubscription: Subscription;
  answerVersionFromServer: number;

  AnswerType = AnswerType;
  QuestionnaireAnswerValidationErrors = QuestionnaireAnswerValidators.Errors;

  private statusWhenItWasLoaded = 'open';

  constructor(
    private questionnnaireClient: QuestionnaireClientService,
    private activatedRoute: ActivatedRoute,
    private translate: TranslateService,
    private questionnaireForm: QuestionnaireFormService,
    private alertCtrl: AlertController,
    private router: Router
  ) {}

  async ngOnInit() {
    const questionnaireInstanceId = Number(
      this.activatedRoute.snapshot.paramMap.get('questionnaireInstanceId')
    );
    await this.fetchQuestionnaireInstance(questionnaireInstanceId);
  }

  ngOnDestroy() {
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
    }
  }

  async ionViewWillLeave() {
    if (this.form.dirty) {
      await this.save();
    }
  }

  async save(leave: boolean = false) {
    if (this.hasQuestionnaireStatus('active')) {
      await this.updateAnswersAndQuestionnaireInstance('in_progress');
    } else if (
      this.hasQuestionnaireStatus('in_progress') ||
      this.hasQuestionnaireStatus('released_once')
    ) {
      await this.updateAnswersAndQuestionnaireInstance();
    }
    if (leave) {
      this.leave();
    }
  }

  async submit() {
    if (this.form.invalid) {
      return;
    }
    const status =
      this.questionnaireInstance.status === 'released_once'
        ? 'released_twice'
        : 'released_once';
    await this.updateAnswersAndQuestionnaireInstance(status);
    this.updateFabButtonStatus();
  }

  getFormControlAtPosition(
    questionIndex: number,
    answerIndex: number
  ): FormControl {
    return (this.form.at(questionIndex) as FormArray).at(
      answerIndex
    ) as FormControl;
  }

  getFormOfCurrentSlide(): FormArray {
    /**
     * Returns an array which contains only form indices of displayed
     * questions, thus results in a mapping from slide index to form
     * index.
     */
    const slideIndexToFormIndexMapping: number[] =
      this.questionnaireInstance.questionnaire.questions.reduce(
        (array: number[], question, index) => {
          if (this.isConditionMet(question)) {
            return [...array, index];
          } else {
            return array;
          }
        },
        []
      );
    return this.form.at(
      slideIndexToFormIndexMapping[this.currentSlideIndex]
    ) as FormArray;
  }

  slideNext() {
    const form = this.getFormOfCurrentSlide();
    if (
      form.hasError(this.QuestionnaireAnswerValidationErrors.REQUIRED_ERROR)
    ) {
      this.showWarningAlert(
        'QUESTIONNAIRE_QUESTIONS.ALERT_SUBTITLE_ANSWER_CURRENT_QUESTION'
      );
    }
    if (form && form.invalid) {
      form.controls.forEach((control) => control.markAsDirty());
      return;
    }
    this.slides.slideNext();
  }

  async beforeSlideChange() {
    this.content.scrollToTop();

    if (this.questionnaireInstance.status === 'active') {
      await this.updateAnswersAndQuestionnaireInstance('in_progress');
    } else {
      await this.updateAnswersAndQuestionnaireInstance();
    }
  }

  async afterSlideChange() {
    this.updateFabButtonStatus();
    this.currentSlideIndex = await this.slides.getActiveIndex();
    this.lockSwipeToNextIfFormInvalid();
  }

  async afterSlideInit() {
    this.lockSwipeToNextIfFormInvalid();
  }

  hasQuestionnaireStatus(status: QuestionnaireStatus): boolean {
    return (
      this.questionnaireInstance && this.questionnaireInstance.status === status
    );
  }

  isConditionMet(element: Question | AnswerOption): boolean {
    if (element) {
      if ('answer_options' in element && element.answer_options) {
        const atLeastOneAnswerOptionIsShown = element.answer_options.some(
          (value) => {
            return this.conditionChecker.isConditionMet(
              this.form,
              value.condition
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
      return this.conditionChecker.isConditionMet(this.form, element.condition);
    } else {
      return false;
    }
  }

  isEmptyFormControlValue(value: FormControlValue): boolean {
    return QuestionnaireFormService.isEmptyFormControlValue(value);
  }

  private async fetchQuestionnaireInstance(questionnaireInstanceId: number) {
    this.isLoading = true;

    try {
      this.questionnaireInstance =
        await this.questionnnaireClient.getQuestionnaireInstance(
          questionnaireInstanceId
        );

      this.statusWhenItWasLoaded = this.questionnaireInstance.status.includes(
        'released'
      )
        ? 'closed'
        : 'open';

      this.study = await this.questionnnaireClient.getStudy(
        this.questionnaireInstance.study_id
      );

      this.conditionChecker = new QuestionnaireConditionChecker(
        this.questionnaireInstance.questionnaire.questions
      );

      const answers = await this.questionnnaireClient.getAnswers(
        questionnaireInstanceId
      );
      this.answerVersionFromServer = answers[0]?.versioning ?? 0;

      this.form = await this.questionnaireForm.createQuestionnaireAnswersForm(
        this.questionnaireInstance.questionnaire.questions,
        answers,
        !this.isQuestionnaireInstanceEditable()
      );

      this.canGoToPrevious = false;
      this.canGoToNext = !this.hasQuestionnaireStatus('released_twice');
      this.canSubmit = false;

      this.form.valueChanges.subscribe(() => {
        this.deleteDisabledAnswers();
        this.updateSlideHeight();
      });
    } catch (error) {
      console.error(error);
    }
    this.isLoading = false;
  }

  private lockSwipeToNextIfFormInvalid() {
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
    }
    const currentSlideForm = this.getFormOfCurrentSlide();
    if (currentSlideForm) {
      this.slides.lockSwipeToNext(currentSlideForm.status === 'INVALID');
      this.statusChangesSubscription = currentSlideForm.statusChanges.subscribe(
        (status) => this.slides.lockSwipeToNext(status === 'INVALID')
      );
    }
  }

  /**
   * If any form value changes and there is a condition targeting that value, the condition
   * now could potentially not be met anymore. In this case form values having that condition
   * need to be resetted - both within the current form AND on the server.
   */
  private deleteDisabledAnswers() {
    this.questionnaireInstance.questionnaire.questions.forEach(
      (question, questionIndex) => {
        if (!this.isConditionMet(question)) {
          question.answer_options.forEach((answerOption, answerIndex) =>
            this.deleteSingleAnswer(questionIndex, answerIndex, answerOption)
          );
        } else {
          question.answer_options.forEach((answerOption, answerIndex) => {
            if (!this.isConditionMet(answerOption)) {
              this.deleteSingleAnswer(questionIndex, answerIndex, answerOption);
            }
          });
        }
      }
    );
    /**
     * If just any single condition check result changed, we also need to
     * trigger form validation, as the form cannot know about this change.
     * Due to missing information about which form control's value change
     * triggered this method, we simply update the full form.
     */
    this.form.controls.forEach((control) =>
      control.updateValueAndValidity({ emitEvent: false })
    );
  }

  private deleteSingleAnswer(
    questionIndex: number,
    answerIndex: number,
    answerOption: AnswerOption
  ): boolean {
    const control = (this.form.at(questionIndex) as FormArray).at(answerIndex);

    if (!this.isEmptyFormControlValue(control.value)) {
      control.patchValue(
        QuestionnaireFormService.getDefaultFormControlValue(
          answerOption.answer_type_id
        )
      );
      this.questionnnaireClient.deleteAnswer(
        this.questionnaireInstance.id,
        answerOption.id
      );
      return true;
    }
    return false;
  }

  /**
   * The slides' content height may change whenever new questions
   * are shown or hidden or whenever form control values change.
   * Those changes are not always detected by the slides component
   * as it does not live within Angular's component life cycle.
   *
   * This is an issue especially with single select fields and
   * uploaded photos. Those changes increase the content height,
   * but do it too late for the slide to pick up the changes.
   *
   * Thus we manually trigger the slide's height update after every
   * value change of the questionnaire form.
   *
   * As we want a responsive UI, but do not know how fast the mobile
   * device renders new content, we trigger the update 10 times
   * within 1000ms.
   */
  private updateSlideHeight(): void {
    let updateCount = 10;
    const interval = setInterval(() => {
      void this.slides.updateAutoHeight();
      --updateCount;
      if (updateCount <= 0) {
        clearInterval(interval);
      }
    }, 100);
  }

  private async updateAnswersAndQuestionnaireInstance(
    newStatus?: QuestionnaireStatus
  ) {
    await this.updateAnswers();
    await this.updateQuestionnaireInstance(newStatus);
  }

  private async updateAnswers() {
    const answers = this.questionnaireForm.getAnswers(
      this.questionnaireInstance.questionnaire.questions,
      this.form
    );
    if (!answers.length) {
      return;
    }
    try {
      await this.questionnnaireClient.postAnswers(
        this.questionnaireInstance.id,
        {
          answers,
          version: this.getAnswerVersion(
            this.questionnaireInstance.status,
            this.answerVersionFromServer,
            this.questionnaireInstance.release_version
          ),
        }
      );

      this.form.markAsPristine();
    } catch (err) {
      if (
        err.error.statusCode === 400 &&
        err.error.message.includes(
          'answer value should have a maximum length of'
        )
      ) {
        await this.showWarningAlert(
          'QUESTIONNAIRE_QUESTIONS.UPLOADED_IMAGE_TOO_LARGE'
        );
      }
      console.error(err);
    }
  }

  private async updateQuestionnaireInstance(status?: QuestionnaireStatus) {
    const progress = this.calculateProgress();
    let data;

    if (status) {
      data = { progress, status };
    } else {
      data = { progress };
    }

    switch (status) {
      case 'released_once':
        data.release_version = 1;
        break;
      case 'released_twice':
        data.release_version = 2;
        break;
    }

    try {
      await this.questionnnaireClient.putQuestionnaireInstance(
        this.questionnaireInstance.id,
        data
      );

      this.questionnaireInstance.progress = progress;
      if (status) {
        this.questionnaireInstance.status = status;
      }

      if (status === 'released_once') {
        await this.showSubmissingAlert(
          'QUESTIONNAIRE_QUESTIONS.ALERT_SUBTITLE_ANSWERS_SENT'
        );
        await this.findAndOpenNextQuestionnaireInstance();
      } else if (status === 'released_twice') {
        await this.showSubmissingAlert(
          'QUESTIONNAIRE_QUESTIONS.ALERT_SUBTITLE_SENT_LAST_TIME'
        );
        await this.findAndOpenNextQuestionnaireInstance();
      }
    } catch (error) {
      await this.showWarningAlert('QUESTIONNAIRE_QUESTIONS.TOAST_MSG2');
      console.error(error);
    }
  }

  private isQuestionnaireInstanceEditable(): boolean {
    return this.questionnaireInstance.status !== 'released_twice';
  }

  private calculateProgress(): number {
    let totalAnswersCount = 0;
    let answersCompletedCount = 0;

    this.questionnaireInstance.questionnaire.questions.forEach(
      (question, questionIndex) => {
        if (this.isConditionMet(question)) {
          question.answer_options.forEach((answerOption, answerIndex) => {
            if (this.isConditionMet(answerOption)) {
              totalAnswersCount += 1;

              const control = this.getFormControlAtPosition(
                questionIndex,
                answerIndex
              );
              if (
                control &&
                !this.isEmptyFormControlValue(control.value) &&
                control.valid
              ) {
                answersCompletedCount += 1;
              }
            }
          });
        }
      }
    );
    return Math.round((answersCompletedCount / totalAnswersCount) * 100);
  }

  private async updateFabButtonStatus() {
    this.canGoToPrevious = !(await this.slides.isBeginning());
    this.canGoToNext = !(await this.slides.isEnd());
    this.canSubmit =
      (await this.slides.isEnd()) &&
      !this.hasQuestionnaireStatus('released_twice');
  }

  private async showWarningAlert(message: string) {
    await this.showAlert(message, 'GENERAL.WARNING');
  }

  private async showSubmissingAlert(message: string) {
    await this.showAlert(message, 'GENERAL.SUBMISSION');
  }

  private async showAlert(message: string, header: string) {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant(header),
      message: this.translate.instant(message),
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async findAndOpenNextQuestionnaireInstance() {
    try {
      let queuesResult = await this.getQuestionnaireInstanceQueues();
      if (queuesResult.length < 1) {
        queuesResult = await this.getQuestionnaireInstanceQueues();
      }
      if (queuesResult.length < 1) {
        this.leave();
        return;
      }

      let foundInstance: QuestionnaireInstance;
      for (let i = 0; !foundInstance && i < queuesResult.length; i++) {
        try {
          const instance =
            await this.questionnnaireClient.getQuestionnaireInstance(
              queuesResult[i].questionnaire_instance_id
            );
          if (instance) {
            if (
              instance.status !== 'released_once' &&
              instance.status !== 'released_twice'
            ) {
              foundInstance = instance;
            }
            await this.questionnnaireClient.deleteQuestionnaireInstanceQueue(
              this.questionnaireInstance.user_id,
              queuesResult[i].questionnaire_instance_id
            );
          }
        } catch (error) {
          console.log(
            'queued instance is not available, trying next one',
            error
          );
        }
      }
      if (foundInstance) {
        this.router.navigate(['questionnaire', foundInstance.id]);
      } else {
        this.leave();
      }
    } catch (error) {
      console.error(error);
    }
  }

  private leave() {
    this.router.navigate(['questionnaire'], {
      queryParams: { status: this.statusWhenItWasLoaded },
    });
  }

  private async getQuestionnaireInstanceQueues(): Promise<
    QuestionnaireInstanceQueue[]
  > {
    await this.timeout(300);
    return this.questionnnaireClient.getQuestionnaireInstanceQueues(
      this.questionnaireInstance.user_id
    );
  }

  private timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private getAnswerVersion(
    questionnaire_instance_status: string,
    answerVersionFromServer: number,
    release_version: number
  ): number | undefined {
    let version: number | undefined;
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
