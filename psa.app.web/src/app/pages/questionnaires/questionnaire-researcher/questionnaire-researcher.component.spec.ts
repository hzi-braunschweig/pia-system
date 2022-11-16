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
import { MatDialog } from '@angular/material/dialog';
import { MediaObserver } from '@angular/flex-layout';
import { AlertService } from '../../../_services/alert.service';
import {
  createQuestionnaire,
  createStudy,
} from '../../../psa.app.core/models/instance.helper.spec';
import { NEVER } from 'rxjs';
import { DialogPopUpComponent } from '../../../_helpers/dialog-pop-up';
import createSpyObj = jasmine.createSpyObj;
import SpyObj = jasmine.SpyObj;

describe('QuestionnaireResearcherComponent', () => {
  let fixture: MockedComponentFixture;
  let component: QuestionnaireResearcherComponent;

  let activatedRoute: SpyObj<ActivatedRoute>;
  let router: SpyObj<Router>;
  let translate: SpyObj<TranslateService>;
  let dialog: SpyObj<MatDialog>;
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
    dialog = createSpyObj<MatDialog>('MatDialog', ['open']);

    mediaObserver = createSpyObj<MediaObserver>('MediaObserver', [
      'asObservable',
    ]);
    mediaObserver.asObservable.and.returnValue(NEVER);

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
});
