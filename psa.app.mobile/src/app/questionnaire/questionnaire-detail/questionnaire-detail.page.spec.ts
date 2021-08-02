/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireDetailPage } from './questionnaire-detail.page';
import { QuestionnaireClientService } from '../questionnaire-client.service';
import { QuestionnaireFormService } from '../questionnaire-form/questionnaire-form.service';
import { QuestionnaireRestrictionDaysAsDatePipe } from './questionnaire-restriction-days-as-date.pipe';
import { QuestionnaireFillDatePlaceholdersPipe } from './questionnaire-fill-date-placeholders.pipe';

describe('QuestionnaireDetailPage', () => {
  let component: QuestionnaireDetailPage;
  let fixture: ComponentFixture<QuestionnaireDetailPage>;

  let questionnnaireClient: SpyObj<QuestionnaireClientService>;
  let translate: SpyObj<TranslateService>;
  let questionnaireForm: SpyObj<QuestionnaireFormService>;
  let alertCtrl: SpyObj<AlertController>;
  let router: SpyObj<Router>;
  let activatedRoute;

  beforeEach(() => {
    questionnnaireClient = jasmine.createSpyObj('QuestionnaireClientService', [
      'getQuestionnaireInstance',
      'getAnswers',
      'getStudy',
    ]);
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    questionnaireForm = jasmine.createSpyObj('QuestionnaireFormService', [
      'createQuestionnaireAnswersForm',
    ]);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ questionnaireInstanceId: 1234 }),
      },
    };

    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireDetailPage,
        MockPipe(TranslatePipe),
        MockPipe(QuestionnaireRestrictionDaysAsDatePipe),
        MockPipe(QuestionnaireFillDatePlaceholdersPipe),
      ],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: QuestionnaireClientService, useValue: questionnnaireClient },
        { provide: TranslateService, useValue: translate },
        { provide: QuestionnaireFormService, useValue: questionnaireForm },
        { provide: AlertController, useValue: alertCtrl },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: activatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
