/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { FormArray, FormBuilder } from '@angular/forms';
import { MockModule, MockPipe } from 'ng-mocks';

import { QuestionnaireDetailPage } from './questionnaire-detail.page';
import { QuestionnaireClientService } from '../questionnaire-client.service';
import { QuestionnaireFormService } from '../questionnaire-form/questionnaire-form.service';
import { QuestionnaireRestrictionDaysAsDatePipe } from './questionnaire-restriction-days-as-date.pipe';
import { QuestionnaireFillDatePlaceholdersPipe } from './questionnaire-fill-date-placeholders.pipe';
import { QuestionnaireInstance, Study } from '../questionnaire.model';
import SpyObj = jasmine.SpyObj;

describe('QuestionnaireDetailPage', () => {
  let component: QuestionnaireDetailPage;
  let fixture: ComponentFixture<QuestionnaireDetailPage>;

  let questionnnaireClient: SpyObj<QuestionnaireClientService>;
  let translate: SpyObj<TranslateService>;
  let questionnaireForm: SpyObj<QuestionnaireFormService>;
  let alertCtrl: SpyObj<AlertController>;
  let router: SpyObj<Router>;
  let activatedRoute;

  beforeEach(async () => {
    questionnnaireClient = jasmine.createSpyObj('QuestionnaireClientService', [
      'getQuestionnaireInstance',
      'getAnswers',
      'getStudy',
      'deleteAnswer',
    ]);
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    questionnaireForm = jasmine.createSpyObj('QuestionnaireFormService', [
      'createQuestionnaireAnswersForm',
    ]);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ questionnaireInstanceId: 25993912 }),
      },
    };

    questionnnaireClient.getQuestionnaireInstance.and.resolveTo(
      createQuestionnaireInstance()
    );
    questionnnaireClient.getStudy.and.resolveTo(createStudy());
    questionnnaireClient.getAnswers.and.resolveTo(createAnswers());

    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireDetailPage,
        MockPipe(TranslatePipe),
        MockPipe(QuestionnaireRestrictionDaysAsDatePipe),
        MockPipe(QuestionnaireFillDatePlaceholdersPipe),
      ],
      imports: [MockModule(IonicModule)],
      providers: [
        QuestionnaireFormService,
        FormBuilder,
        { provide: QuestionnaireClientService, useValue: questionnnaireClient },
        { provide: TranslateService, useValue: translate },
        { provide: AlertController, useValue: alertCtrl },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireDetailPage);
    component = fixture.componentInstance;
    await component.ngOnInit();
    fixture.detectChanges();
  });

  describe('getFormOfCurrentSlide()', () => {
    it('should return the correct form for the current slide', () => {
      component.currentSlideIndex = 3;

      const result = component.getFormOfCurrentSlide();

      expect(result).toBe(component.form.at(4) as FormArray);
    });
  });

  describe('deleteDisabledAnswers()', () => {
    it('should delete disabled answers', () => {
      (component.form.at(0) as FormArray).at(0).setValue('Nein');

      expect(questionnnaireClient.deleteAnswer).toHaveBeenCalled();
    });
  });

  function createStudy(): Study {
    return {
      name: 'Staff Test',
      sample_prefix: 'TEST',
      sample_suffix_length: 8,
      has_rna_samples: false,
    } as Study;
  }

  function createQuestionnaireInstance(): QuestionnaireInstance {
    return {
      id: 25993912,
      study_id: 'Staff Test',
      questionnaire_id: 528,
      questionnaire_name: 'Required Validierung',
      user_id: 'Rtest-2264859154',
      date_of_issue: '2021-10-21T00:00:00.000Z',
      date_of_release_v1: null,
      date_of_release_v2: null,
      cycle: 11,
      status: 'in_progress',
      notifications_scheduled: false,
      progress: 100,
      release_version: 0,
      questionnaire_version: 1,
      questionnaire: {
        id: 528,
        study_id: 'Staff Test',
        name: 'Required Validierung',
        no_questions: 6,
        cycle_amount: 0,
        cycle_unit: 'spontan',
        activate_after_days: 0,
        deactivate_after_days: 0,
        notification_tries: 0,
        notification_title: '',
        notification_body_new: '',
        notification_body_in_progress: '',
        version: 1,
        updated_at: '2021-10-21T07:14:09.580Z',
        condition: null,
        questions: [
          {
            id: 4057,
            questionnaire_id: 528,
            text: 'Die folgenden Fragen sind Testfragen, mit gegenseitigen Bedingungen',
            position: 1,
            is_mandatory: true,
            variable_name: '',
            questionnaire_version: 1,
            answer_options: [
              {
                id: 10038,
                question_id: 4057,
                text: 'Wurden Sie seit dem 1. Februar 2020 einmal oder mehrfach auf Corona getestet? ',
                answer_type_id: 1,
                is_notable: [false, false],
                values: ['Ja', 'Nein'],
                values_code: [1, 0],
                position: 1,
                is_condition_target: true,
                restriction_min: null,
                restriction_max: null,
                is_decimal: false,
                variable_name: '',
                condition: null,
              },
            ],
            condition: null,
          },
          {
            id: 4058,
            questionnaire_id: 528,
            text: 'Wie war das Testergebnis?',
            position: 2,
            is_mandatory: true,
            variable_name: '',
            questionnaire_version: 1,
            answer_options: [
              {
                id: 10039,
                question_id: 4058,
                text: '',
                answer_type_id: 1,
                is_notable: [false, false],
                values: [
                  'Mindestens ein Testergebnis war positiv.',
                  'Alle Testergebnisse waren negativ.',
                ],
                values_code: [1, 0],
                position: 1,
                is_condition_target: true,
                restriction_min: null,
                restriction_max: null,
                is_decimal: false,
                variable_name: '',
                condition: null,
              },
            ],
            condition: {
              condition_type: 'internal_this',
              condition_answer_option_id: null,
              condition_question_id: 4058,
              condition_questionnaire_id: null,
              condition_operand: '==',
              condition_value: 'Ja',
              condition_target_answer_option: 10038,
              condition_target_questionnaire: 528,
              id: 23453,
              condition_link: 'OR',
              condition_questionnaire_version: 1,
              condition_target_questionnaire_version: 1,
            },
          },
          {
            id: 4059,
            questionnaire_id: 528,
            text: 'Wann wurde der Test auf das Corona-Virus durchgeführt? Wenn Sie häufiger positiv getestet wurden, geben Sie bitte das Datum des letzten positiven Tests an. ',
            position: 3,
            is_mandatory: true,
            variable_name: '',
            questionnaire_version: 1,
            answer_options: [
              {
                id: 10040,
                question_id: 4059,
                text: '',
                answer_type_id: 5,
                is_notable: [],
                values: [],
                values_code: [],
                position: 1,
                is_condition_target: false,
                restriction_min: null,
                restriction_max: null,
                is_decimal: false,
                variable_name: '',
                condition: null,
              },
            ],
            condition: {
              condition_type: 'internal_this',
              condition_answer_option_id: null,
              condition_question_id: 4059,
              condition_questionnaire_id: null,
              condition_operand: '==',
              condition_value: 'Mindestens ein Testergebnis war positiv.',
              condition_target_answer_option: 10039,
              condition_target_questionnaire: 528,
              id: 23454,
              condition_link: 'OR',
              condition_questionnaire_version: 1,
              condition_target_questionnaire_version: 1,
            },
          },
          {
            id: 4060,
            questionnaire_id: 528,
            text: 'Wann wurde der Test auf das Corona-Virus durchgeführt? Wenn Sie häufiger getestet wurden, tragen Sie bitte das Datum des letzten Tests ein.',
            position: 4,
            is_mandatory: true,
            variable_name: '',
            questionnaire_version: 1,
            answer_options: [
              {
                id: 10041,
                question_id: 4060,
                text: '',
                answer_type_id: 5,
                is_notable: [],
                values: [],
                values_code: [],
                position: 1,
                is_condition_target: false,
                restriction_min: null,
                restriction_max: null,
                is_decimal: false,
                variable_name: '',
                condition: null,
              },
            ],
            condition: {
              condition_type: 'internal_this',
              condition_answer_option_id: null,
              condition_question_id: 4060,
              condition_questionnaire_id: null,
              condition_operand: '==',
              condition_value: 'Alle Testergebnisse waren negativ.',
              condition_target_answer_option: 10039,
              condition_target_questionnaire: 528,
              id: 23455,
              condition_link: 'OR',
              condition_questionnaire_version: 1,
              condition_target_questionnaire_version: 1,
            },
          },
          {
            id: 4061,
            questionnaire_id: 528,
            text: 'Welche Art von Test wurde durchgeführt? \n\nWenn Sie häufiger positiv getestet wurden, geben Sie bitte die Testart des letzten positiven Tests an. ',
            position: 5,
            is_mandatory: true,
            variable_name: '',
            questionnaire_version: 1,
            answer_options: [
              {
                id: 10042,
                question_id: 4061,
                text: '',
                answer_type_id: 1,
                is_notable: [false, false, false, false],
                values: [
                  'Es wurde ein Nasen- oder Rachen-Abstrich entnommen.',
                  'Mir wurde Blut abgenommen.',
                  'Antigen-Schnelltest',
                  'Anderes',
                ],
                values_code: [1, 2, 3, 4],
                position: 1,
                is_condition_target: true,
                restriction_min: null,
                restriction_max: null,
                is_decimal: false,
                variable_name: '',
                condition: null,
              },
              {
                id: 10043,
                question_id: 4061,
                text: 'Welche andere Testart wurde durchgeführt?',
                answer_type_id: 4,
                is_notable: [],
                values: [],
                values_code: [],
                position: 2,
                is_condition_target: false,
                restriction_min: null,
                restriction_max: null,
                is_decimal: false,
                variable_name: '',
                condition: {
                  condition_type: 'internal_this',
                  condition_answer_option_id: 10043,
                  condition_question_id: null,
                  condition_questionnaire_id: null,
                  condition_operand: '==',
                  condition_value: 'Anderes',
                  condition_target_answer_option: 10042,
                  condition_target_questionnaire: 528,
                  id: 23457,
                  condition_link: 'OR',
                  condition_questionnaire_version: 1,
                  condition_target_questionnaire_version: 1,
                },
              },
            ],
            condition: {
              condition_type: 'internal_this',
              condition_answer_option_id: null,
              condition_question_id: 4061,
              condition_questionnaire_id: null,
              condition_operand: '==',
              condition_value: 'Mindestens ein Testergebnis war positiv.',
              condition_target_answer_option: 10039,
              condition_target_questionnaire: 528,
              id: 23456,
              condition_link: 'OR',
              condition_questionnaire_version: 1,
              condition_target_questionnaire_version: 1,
            },
          },
          {
            id: 4062,
            questionnaire_id: 528,
            text: 'Vielen Dank für Ihre Angaben!',
            position: 6,
            is_mandatory: false,
            variable_name: '',
            questionnaire_version: 1,
            answer_options: [],
            condition: null,
          },
        ],
      },
    };
  }

  function createAnswers() {
    return [
      {
        questionnaire_instance_id: 25993912,
        question_id: 4057,
        answer_option_id: 10038,
        versioning: 1,
        value: 'Ja',
        date_of_release: null,
        releasing_person: null,
      },
      {
        questionnaire_instance_id: 25993912,
        question_id: 4058,
        answer_option_id: 10039,
        versioning: 1,
        value: 'Mindestens ein Testergebnis war positiv.',
        date_of_release: null,
        releasing_person: null,
      },
      {
        questionnaire_instance_id: 25993912,
        question_id: 4059,
        answer_option_id: 10040,
        versioning: 1,
        value: '2021-10-21T10:51:05.070Z',
        date_of_release: null,
        releasing_person: null,
      },
      {
        questionnaire_instance_id: 25993912,
        question_id: 4060,
        answer_option_id: 10041,
        versioning: 1,
        value: '',
        date_of_release: null,
        releasing_person: null,
      },
      {
        questionnaire_instance_id: 25993912,
        question_id: 4061,
        answer_option_id: 10042,
        versioning: 1,
        value: 'Anderes',
        date_of_release: null,
        releasing_person: null,
      },
      {
        questionnaire_instance_id: 25993912,
        question_id: 4061,
        answer_option_id: 10043,
        versioning: 1,
        value: '',
        date_of_release: null,
        releasing_person: null,
      },
    ];
  }
});
