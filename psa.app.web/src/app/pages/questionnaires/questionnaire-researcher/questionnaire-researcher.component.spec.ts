/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MockBuilder, MockedComponentFixture, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  convertToParamMap,
  Router,
} from '@angular/router';
import { QuestionnaireService } from '../../../psa.app.core/providers/questionnaire-service/questionnaire-service';
import { UserService } from '../../../psa.app.core/providers/user-service/user.service';
import { fakeAsync, tick } from '@angular/core/testing';
import { QuestionnaireResearcherComponent } from './questionnaire-researcher.component';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MediaObserver } from '@angular/flex-layout';
import { AlertService } from '../../../_services/alert.service';
import {
  createQuestionnaire,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { NEVER, of } from 'rxjs';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import { DialogOkCancelComponent } from '../../../_helpers/dialog-ok-cancel';
import {
  Condition,
  ConditionType,
} from '../../../psa.app.core/models/questionnaire';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('QuestionnaireResearcherComponent', () => {
  let fixture: MockedComponentFixture;
  let component: QuestionnaireResearcherComponent;

  let activatedRoute: SpyObj<ActivatedRoute>;
  let router: SpyObj<Router>;
  let translate: SpyObj<TranslateService>;
  let dialog: SpyObj<MatDialog>;
  let dialogRef: SpyObj<MatDialogRef<unknown, unknown>>;
  let mediaObserver: SpyObj<MediaObserver>;
  let alertService: SpyObj<AlertService>;
  let questionnaireService: SpyObj<QuestionnaireService>;
  let userService: SpyObj<UserService>;

  beforeEach(async () => {
    // Provider and Services
    activatedRoute = createSpyObj<ActivatedRoute>('ActivatedRoute', [], {
      snapshot: {
        params: { id: '1234' },
        paramMap: convertToParamMap({
          id: '1234',
          version: 1,
        }),
      } as unknown as ActivatedRouteSnapshot,
    });

    router = createSpyObj<Router>('Router', ['navigate', 'navigateByUrl']);
    translate = createSpyObj<TranslateService>('TranslateService', ['instant']);
    dialogRef = createSpyObj<MatDialogRef<unknown, unknown>>('MatDialogRef', {
      afterClosed: of(undefined),
    });
    dialog = createSpyObj<MatDialog>('MatDialog', { open: dialogRef });
    mediaObserver = createSpyObj<MediaObserver>('MediaObserver', {
      asObservable: NEVER,
    });

    alertService = createSpyObj<AlertService>('AlertService', ['errorObject']);

    questionnaireService = createSpyObj<QuestionnaireService>(
      'QuestionnaireService',
      [
        'getQuestionnaires',
        'getQuestionnaire',
        'postQuestionnaire',
        'reviseQuestionnaire',
        'putQuestionnaire',
        'deactivateQuestionnaire',
      ]
    );
    const questionnaire = createQuestionnaire();
    questionnaireService.getQuestionnaires.and.resolveTo({
      questionnaires: [questionnaire],
      links: { self: { href: '' } },
    });
    questionnaireService.getQuestionnaire.and.resolveTo(questionnaire);
    questionnaireService.putQuestionnaire.and.resolveTo(
      createQuestionnaire({ name: 'New Name FB' })
    );
    questionnaireService.reviseQuestionnaire.and.resolveTo(
      createQuestionnaire({ name: 'New Name FB' })
    );

    userService = createSpyObj('UserService', ['getStudies']);
    userService.getStudies.and.resolveTo([createStudy()]);

    // Build Base Module
    await MockBuilder(QuestionnaireResearcherComponent, AppModule)
      .mock(ActivatedRoute, activatedRoute)
      .mock(Router, router)
      .mock(TranslateService, translate)
      .mock(MatDialog, dialog)
      .mock(MediaObserver, mediaObserver)
      .mock(AlertService, alertService)
      .mock(QuestionnaireService, questionnaireService)
      .mock(UserService, userService);
  });

  beforeEach(fakeAsync(() => {
    // Create component
    fixture = MockRender(QuestionnaireResearcherComponent);
    component = fixture.point.componentInstance;
    tick(); // wait for ngOnInit to finish
  }));

  describe('updateQuestionnaire()', () => {
    it('should update an existing questionnaire', fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({ name: 'New Name FB' });

      // Act
      component.updateQuestionnaire(1234, 1, questionnaire, false);
      tick();

      // Assert
      expect(questionnaireService.putQuestionnaire).toHaveBeenCalledOnceWith(
        1234,
        1,
        questionnaire
      );
    }));

    it('should revise an existing questionnaire', fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({ name: 'New Name FB' });

      // Act
      component.updateQuestionnaire(1234, 1, questionnaire, true);
      tick();

      // Assert
      expect(questionnaireService.reviseQuestionnaire).toHaveBeenCalledOnceWith(
        1234,
        questionnaire
      );
    }));

    it('should show a success dialog on successful save', fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({ name: 'New Name FB' });

      // Act
      component.updateQuestionnaire(1234, 1, questionnaire, false);
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledOnceWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          content: 'DIALOG.SUCCESS',
          values: { questionnaireName: 'New Name FB' },
          isSuccess: true,
        },
      });
    }));

    it("should navigate to the updated questionnaire's edit form", fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({ name: 'New Name FB' });

      // Act
      component.updateQuestionnaire(1234, 1, questionnaire, false);
      tick();

      // Assert
      expect(router.navigate).toHaveBeenCalledOnceWith([
        '/questionnaire',
        1234,
        1,
        'edit',
      ]);
    }));

    it('should show a failure dialog if an error occurs', fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({ name: 'New Name FB' });
      questionnaireService.putQuestionnaire.and.rejectWith({
        error: new Error('some error'),
      });

      // Act
      component.updateQuestionnaire(1234, 1, questionnaire, false);
      tick();

      // Assert
      expect(dialog.open).toHaveBeenCalledOnceWith(DialogPopUpComponent, {
        width: '500px',
        data: {
          content: 'DIALOG.FAIL',
          values: { message: 'some error' },
          isSuccess: false,
        },
      });
    }));
  });

  describe('setQuestionnaireType()', () => {
    it('should reset various form fields if set to "for_research_team"', fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({
        name: 'New Name FB',
        type: 'for_research_team',
      });
      component.initForm(questionnaire);
      tick();

      // Act
      component.setQuestionnaireType();

      // Assert
      expect(component.myForm.value).toEqual(
        jasmine.objectContaining({
          name: 'New Name FB',
          type: 'for_research_team',
          cycle_unit: 'once',
          cycle_amount: 1,
          activate_after_days: 0,
          deactivate_after_days: 999999,
          finalises_after_days: 999999,
          expires_after_days: 999999,
          notification_tries: 0,
          publish: 'allaudiences',
        })
      );
    }));

    it('should reset various form fields if set to "for_probands"', fakeAsync(() => {
      // Arrange
      const questionnaire = createQuestionnaire({
        name: 'New Name FB',
        type: 'for_probands',
      });
      component.initForm(questionnaire);
      tick();

      // Act
      component.setQuestionnaireType();

      // Assert
      expect(component.myForm.value).toEqual(
        jasmine.objectContaining({
          name: 'New Name FB',
          type: 'for_probands',
          cycle_unit: null,
          cycle_amount: null,
          activate_after_days: null,
          deactivate_after_days: null,
          finalises_after_days: 5,
          expires_after_days: 2,
          notification_tries: null,
        })
      );
    }));
  });

  it('should sort questionnaires by name and version', fakeAsync(() => {
    const questionnaires = [
      createQuestionnaire({ name: 'Xa', version: 1 }),
      createQuestionnaire({ name: 'A', version: 2 }),
      createQuestionnaire({ name: 'A', version: 1 }),
      createQuestionnaire({ name: 'A', version: 3 }),
      createQuestionnaire({ name: 'Xb', version: 1 }),
      createQuestionnaire({ name: 'c', version: 1 }),
    ];
    questionnaireService.getQuestionnaires.and.resolveTo({
      // we want to send a copy, because a reference would result in our test array to be sorted as well
      questionnaires: JSON.parse(JSON.stringify(questionnaires)),
      links: { self: { href: '' } },
    });

    component.ngOnInit();
    tick();

    expect(component.questionnaires).toEqual([
      questionnaires[2],
      questionnaires[1],
      questionnaires[3],
      questionnaires[5],
      questionnaires[0],
      questionnaires[4],
    ]);
  }));

  describe('Select study', () => {
    beforeEach(() => {
      component.studies = [
        createStudy({ name: 'Study A' }),
        createStudy({ name: 'Study B' }),
      ];
      component.questionnaires = [
        createQuestionnaire({
          name: 'Q1',
          study_id: 'Study A',
        }),
        createQuestionnaire({
          name: 'Q2',
          study_id: 'Study B',
        }),
        createQuestionnaire({
          name: 'Q3',
          study_id: 'Study B',
        }),
        createQuestionnaire({
          name: 'Q4',
          study_id: 'Study A',
        }),
      ];
    });

    it('should filter questionnaires by selected study', fakeAsync(() => {
      component.initForm(
        createQuestionnaire({
          name: 'Q0',
          study_id: 'Study A',
        })
      );

      tick();

      // Assert
      expect(component.questionnairesForConditionQuestionnaire).toEqual([
        component.questionnaires[0],
        component.questionnaires[3],
      ]);
    }));

    describe('Show confirmation dialog for removing external conditions', () => {
      const dummyCondition: Condition = {
        condition_type: ConditionType.EXTERNAL,
        condition_questionnaire_id: 1,
        condition_value: '1',
        condition_answer_option_id: 1,
        condition_link: 'AND',
        condition_operand: '==',
        condition_question_id: 1,
        condition_questionnaire_version: 1,
        condition_target_answer_option: 1,
        condition_target_answer_option_pos: 1,
        condition_target_question_pos: 1,
        condition_target_questionnaire: 1,
        condition_target_questionnaire_version: 1,
      };

      it('should show if questionnaire has external conditions', fakeAsync(() => {
        component.initForm(
          createQuestionnaire({
            name: 'Q0',
            study_id: 'Study A',
            condition: dummyCondition,
          })
        );

        tick();

        component.selectStudy('Study B');

        expect(dialog.open).toHaveBeenCalledWith(DialogOkCancelComponent, {
          width: '500px',
          data: {
            content: 'QUESTIONNAIRE_FORSCHER.WARNING_STUDY_CHANGE',
          },
        });
      }));

      it('should show if question has external conditions', fakeAsync(() => {
        component.initForm(
          createQuestionnaire({
            name: 'Q0',
            study_id: 'Study A',
            questions: [
              {
                id: 1,
                questionnaire_id: 1,
                text: '',
                answer_options: [],
                jump_step: 1,
                condition_error: undefined,
                is_mandatory: false,
                position: 1,
                variable_name: '',
                condition: dummyCondition,
              },
            ],
          })
        );

        tick();

        component.selectStudy('Study B');

        expect(dialog.open).toHaveBeenCalledWith(DialogOkCancelComponent, {
          width: '500px',
          data: {
            content: 'QUESTIONNAIRE_FORSCHER.WARNING_STUDY_CHANGE',
          },
        });
      }));

      it('should show if answer option has external conditions', fakeAsync(() => {
        component.initForm(
          createQuestionnaire({
            name: 'Q0',
            study_id: 'Study A',
            questions: [
              {
                id: 1,
                questionnaire_id: 1,
                text: '',
                jump_step: 1,
                condition_error: undefined,
                is_mandatory: false,
                position: 1,
                variable_name: '',
                condition: undefined,
                answer_options: [
                  {
                    id: 1,
                    answer_type_id: 4,
                    answer_value: '1',
                    question_id: 1,
                    condition_error: undefined,
                    is_condition_target: false,
                    position: 1,
                    text: '',
                    is_decimal: false,
                    is_notable: [false],
                    values: [],
                    restriction_max: null,
                    restriction_min: null,
                    values_code: [],
                    variable_name: '',
                    condition: dummyCondition,
                  },
                ],
              },
            ],
          })
        );

        tick();

        component.selectStudy('Study B');

        expect(dialog.open).toHaveBeenCalledWith(DialogOkCancelComponent, {
          width: '500px',
          data: {
            content: 'QUESTIONNAIRE_FORSCHER.WARNING_STUDY_CHANGE',
          },
        });
      }));

      it('should remove external conditions if confirmed', fakeAsync(() => {
        component.initForm(
          createQuestionnaire({
            name: 'Q0',
            study_id: 'Study A',
            condition: dummyCondition,
            questions: [
              {
                id: 1,
                questionnaire_id: 1,
                text: '',
                jump_step: 1,
                condition_error: undefined,
                is_mandatory: false,
                position: 1,
                variable_name: '',
                condition: dummyCondition,
                answer_options: [
                  {
                    id: 1,
                    answer_type_id: 4,
                    answer_value: '1',
                    question_id: 1,
                    condition_error: undefined,
                    is_condition_target: false,
                    position: 1,
                    text: '',
                    is_decimal: false,
                    is_notable: [false],
                    values: [],
                    restriction_max: null,
                    restriction_min: null,
                    values_code: [],
                    variable_name: '',
                    condition: dummyCondition,
                  },
                ],
              },
              {
                id: 2,
                questionnaire_id: 1,
                text: '',
                jump_step: 1,
                condition_error: undefined,
                is_mandatory: false,
                position: 2,
                variable_name: '',
                condition: {
                  ...dummyCondition,
                  condition_type: ConditionType.INTERNAL_LAST,
                },
                answer_options: [
                  {
                    id: 2,
                    answer_type_id: 4,
                    answer_value: '1',
                    question_id: 2,
                    condition_error: undefined,
                    is_condition_target: false,
                    position: 1,
                    text: '',
                    is_decimal: false,
                    is_notable: [false],
                    values: [],
                    restriction_max: null,
                    restriction_min: null,
                    values_code: [],
                    variable_name: '',
                    condition: {
                      ...dummyCondition,
                      condition_type: ConditionType.INTERNAL_THIS,
                    },
                  },
                ],
              },
            ],
          })
        );

        tick();

        dialogRef.afterClosed.and.returnValue(of('ok'));
        component.selectStudy('Study B');

        tick();

        expect(component.myForm.value.condition).toBeUndefined();
        expect(component.myForm.value.questions[0].condition).toBeUndefined();
        expect(
          component.myForm.value.questions[0].answer_options[0].condition
        ).toBeUndefined();

        expect(
          component.myForm.value.questions[1].condition
        ).not.toBeUndefined();
        expect(
          component.myForm.value.questions[1].answer_options[0].condition
        ).not.toBeUndefined();
      }));
    });
  });
});
