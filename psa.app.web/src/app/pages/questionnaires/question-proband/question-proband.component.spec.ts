/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { FormArray } from '@angular/forms';
import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';

import {
  DisplayStatus,
  QuestionProbandComponent,
} from './question-proband.component';
import { AppModule } from '../../../app.module';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';
import { Study } from '../../../psa.app.core/models/study';
import { CurrentUser } from '../../../_services/current-user.service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { Proband } from '../../../psa.app.core/models/proband';
import { AlertService } from '../../../_services/alert.service';
import { Questionnaire } from 'src/app/psa.app.core/models/questionnaire';
import { SelectedProbandInfoService } from '../../../_services/selected-proband-info.service';
import { Answer } from '../../../psa.app.core/models/answer';
import { AnswerOption } from '../../../psa.app.core/models/answerOption';
import { AnswerType } from '../../../psa.app.core/models/answerType';
import { Question } from '../../../psa.app.core/models/question';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { SwiperComponent } from 'ngx-useful-swiper';
import { DOCUMENT } from '@angular/common';
import { By } from '@angular/platform-browser';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('QuestionProbandComponent', () => {
  let fixture: MockedComponentFixture;
  let component: QuestionProbandComponent;

  let activatedRoute: SpyObj<ActivatedRoute>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let user: SpyObj<CurrentUser>;
  let authService: SpyObj<AuthService>;
  let userService: SpyObj<UserService>;
  let selectedProbandInfoService: SpyObj<SelectedProbandInfoService>;

  beforeEach(async () => {
    // Provider and Services
    activatedRoute = createSpyObj('ActivatedRoute', [], {
      snapshot: new ActivatedRouteSnapshot(),
    });
    activatedRoute.snapshot.params = { instanceId: '1234' };

    questionnaireService = createSpyObj('QuestionnaireService', [
      'getQuestionnaireInstance',
      'getStudy',
      'getAnswers',
      'postAnswers',
      'putQuestionnaireInstance',
      'getHistoricalAnswers',
    ]);
    questionnaireService.getQuestionnaireInstance.and.resolveTo(
      createMockQuestionnaireInstance()
    );
    questionnaireService.getStudy.and.resolveTo(createStudy());
    questionnaireService.getAnswers.and.resolveTo({ answers: createAnswers() });
    questionnaireService.postAnswers.and.resolveTo({
      answers: createAnswers(),
    });
    questionnaireService.putQuestionnaireInstance.and.resolveTo({
      status: 'in_progress',
    } as QuestionnaireInstance);
    questionnaireService.getHistoricalAnswers.and.resolveTo(
      createHistoricalAnswers()
    );

    userService = createSpyObj('UserService', ['getStudy']);
    userService.getStudy.and.resolveTo(createStudy());

    user = createSpyObj<CurrentUser>('CurrentUser', ['hasRole', 'isProband']);
    user.isProband.and.returnValue(false);
    user.hasRole.and.returnValue(true);

    authService = createSpyObj<AuthService>('AuthService', ['getProband']);
    authService.getProband.and.resolveTo(createProband());

    selectedProbandInfoService = createSpyObj<SelectedProbandInfoService>(
      'SelectedProbandInfoService',
      ['updateSideNavInfoSelectedProband']
    );

    // Build Base Module
    await MockBuilder(QuestionProbandComponent, AppModule)
      .mock(ActivatedRoute, activatedRoute)
      .mock(QuestionnaireService, questionnaireService)
      .mock(CurrentUser, user)
      .mock(AuthService, authService)
      .mock(UserService, userService)
      .mock(SelectedProbandInfoService, selectedProbandInfoService)
      .mock(DOCUMENT, document);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(QuestionProbandComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  it('should init questionnaire instance id', () => {
    expect(component.questionnaireInstanceId).toEqual(1234);
  });

  describe('ngOnInit()', () => {
    // beforeEach(async () => await component.ngOnInit());

    it('should load questionnaire', () => {
      expect(
        questionnaireService.getQuestionnaireInstance
      ).toHaveBeenCalledOnceWith(1234);
      expect(component.pseudonym).toEqual('Testproband');
    });

    it('should load study', () => {
      expect(userService.getStudy).toHaveBeenCalledOnceWith('Teststudy');
      expect(component.studyOfQuestionnaire).not.toBeNull();
    });

    it('should load proband and update selected proband', () => {
      expect(authService.getProband).toHaveBeenCalledOnceWith('Testproband');
      expect(
        selectedProbandInfoService.updateSideNavInfoSelectedProband
      ).toHaveBeenCalledOnceWith({
        pseudonym: 'Testproband',
        ids: 'TestIDS',
      });
    });

    it('should init the questionnaire form', () => {
      expect(component.myForm).toBeDefined();
      expect(component.myForm.get('questions')).toHaveSize(8);
      expect(
        (component.myForm.get('questions') as FormArray)
          .at(0)
          .get('answer_options')
      ).toHaveSize(8);
    });

    it('should not show an error alert', () => {
      const alertService = TestBed.inject(AlertService);
      expect(alertService.errorMessage).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy()', () => {
    it('should reset selected proband for Untersuchungsteam', () => {
      // Arrange
      const selectedProbandInfoService = TestBed.inject(
        SelectedProbandInfoService
      ) as SpyObj<SelectedProbandInfoService>;
      selectedProbandInfoService.updateSideNavInfoSelectedProband.calls.reset();

      // Act
      component.ngOnDestroy();

      // Assert
      expect(
        selectedProbandInfoService.updateSideNavInfoSelectedProband
      ).toHaveBeenCalledOnceWith(null);
    });
  });

  describe('goToHistoryView()', () => {
    it('should switch to history view', async () => {
      // Arrange
      document.getElementById = jasmine
        .createSpy()
        .and.returnValue(document.createElement('div'));
      const swiperMock = jasmine.createSpyObj('Swiper', [], {
        activeIndex: 0,
        allowSlidePrev: true,
        allowSlideNext: false,
      });
      component.questionSwiper = { swiper: swiperMock } as SwiperComponent;

      // Act
      await component.goToHistoryView();
      fixture.detectChanges();

      // Assert
      expect(component.displayStatus).toEqual(DisplayStatus.HISTORY);
      expect(
        fixture.debugElement.query(By.css('[data-unit="history-view"]'))
      ).not.toBeNull();
    });
  });

  function createStudy(): Study {
    return {
      name: 'Teststudy',
      has_rna_samples: true,
      sample_prefix: 'XXX',
      sample_suffix_length: 10,
    } as Study;
  }

  function createProband(): Proband {
    return {
      pseudonym: 'Testproband',
      ids: 'TestIDS',
    } as Proband;
  }

  function createMockQuestionnaireInstance(): QuestionnaireInstance {
    return {
      id: 1234,
      status: 'active',
      date_of_issue: new Date(),
      user_id: 'Testproband',
      release_version: 1,
      questionnaire: {
        id: 1,
        name: 'TestQ',
        study_id: 'Teststudy',
        questions: [
          createQuestion({ id: 1 }),
          createQuestion({ id: 2 }),
          createQuestion({ id: 3 }),
          createQuestion({ id: 4 }),
          createQuestion({ id: 5 }),
          createQuestion({ id: 6 }),
          createQuestion({ id: 7 }),
          createQuestion({ id: 8 }),
        ],
      } as Questionnaire,
    } as QuestionnaireInstance;
  }

  function createQuestion(overwrite: Partial<Question> = {}): Question {
    return {
      id: 4321,
      questionnaire_id: 1,
      text: 'some intro text (dat=-5)',
      label: 'some label',
      position: 1,
      is_mandatory: true,
      jump_step: 1,
      answer_options: createAnswerOptions(),
      condition: null,
      condition_error: null,
      ...overwrite,
    };
  }

  function createAnswerOptions(): AnswerOption[] {
    return [
      createAnswerOption({
        id: 1,
        answer_type_id: AnswerType.Text,
        label: 'symptomsComments',
      }),
      createAnswerOption({
        id: 2,
        answer_type_id: AnswerType.Number,
        label: 'weight',
      }),
      createAnswerOption({
        id: 3,
        answer_type_id: AnswerType.Number,
        is_decimal: true,
        label: 'temperature',
      }),
      createAnswerOption({
        id: 4,
        answer_type_id: AnswerType.Date,
        label: 'onsetDate',
      }),
      createAnswerOption({
        id: 5,
        answer_type_id: AnswerType.SingleSelect,
        label: 'lesionsArms',
        values: ['Yes', 'No'],
        values_code: [1, 0],
      }),
      createAnswerOption({
        id: 6,
        answer_type_id: AnswerType.SingleSelect,
        label: 'lesionsFace',
        values: ['Yes', 'No'],
        values_code: [1, 0],
      }),
      createAnswerOption({
        id: 7,
        answer_type_id: AnswerType.SingleSelect,
        label: 'temperatureSource',
        values: ['Infrared', 'Oral', 'Axillary', 'Rectal'],
        values_code: [1, 2, 3, 4],
      }),
      createAnswerOption({
        id: 8,
        answer_type_id: AnswerType.Timestamp,
        label: 'onsetTimestamp',
      }),
    ];
  }

  function createAnswerOption(
    overwrite: Partial<AnswerOption> = {}
  ): AnswerOption {
    return {
      id: 222,
      text: 'some question',
      label: null,
      position: overwrite.id ?? 1,
      question_id: 4321,
      answer_type_id: AnswerType.Text,
      answer_value: null,
      is_condition_target: false,
      restriction_min: null,
      restriction_max: null,
      is_decimal: false,
      condition: null,
      condition_error: null,
      is_notable: null,
      values: [],
      values_code: [],
      ...overwrite,
    };
  }

  function createAnswers(): Answer[] {
    return [
      createAnswer({
        question_id: 1,
        value: 'Lorem ipsum dolor sit amet',
      }),
      createAnswer({
        question_id: 2,
        value: '89',
      }),
      createAnswer({
        question_id: 3,
        value: '36.14159265359',
      }),
      createAnswer({
        question_id: 4,
        value: '2021-09-07T15:17:57.328Z',
      }),
      createAnswer({
        question_id: 5,
        value: 'No',
      }),
      createAnswer({
        question_id: 6,
        value: 'Yes',
      }),
      createAnswer({
        question_id: 7,
        value: 'Oral',
      }),
      createAnswer({
        question_id: 8,
        value: '2021-09-07T15:17:57.328Z',
      }),
    ];
  }

  function createHistoricalAnswers(): Answer[] {
    return [
      createAnswer({
        question_id: 1,
        versioning: 2,
        value: 'Lorem ipsum dolor sit amet',
      }),
      createAnswer({
        question_id: 2,
        versioning: 2,
        value: '89',
      }),
      createAnswer({
        question_id: 3,
        versioning: 2,
        value: '36.14159265359',
      }),
      createAnswer({
        question_id: 4,
        versioning: 2,
        value: '2021-09-07T15:17:57.328Z',
      }),
      createAnswer({
        question_id: 5,
        versioning: 2,
        value: 'No',
      }),
      createAnswer({
        question_id: 6,
        versioning: 2,
        value: 'Yes',
      }),
      createAnswer({
        question_id: 7,
        versioning: 2,
        value: 'Oral',
      }),
      createAnswer({
        question_id: 8,
        versioning: 2,
        value: '1631027877328',
      }),
    ];
  }

  function createAnswer(overwrite: Partial<Answer> = {}): Answer {
    return {
      question_id: 4321,
      questionnaire_instance_id: 1234,
      answer_option_id: overwrite.question_id ?? 999,
      versioning: 1,
      value: null,
      date_of_release: new Date(),
      ...overwrite,
    };
  }
});
