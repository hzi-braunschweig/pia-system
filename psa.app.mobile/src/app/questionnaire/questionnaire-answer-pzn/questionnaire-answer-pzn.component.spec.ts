/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerPznComponent } from './questionnaire-answer-pzn.component';
import { BackButtonService } from '../../shared/services/back-button/back-button.service';

describe('QuestionnaireAnswerPznComponent', () => {
  let component: QuestionnaireAnswerPznComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerPznComponent>;

  let backButton: SpyObj<BackButtonService>;

  beforeEach(() => {
    backButton = jasmine.createSpyObj('BackButtonService', [
      'enable',
      'disable',
    ]);

    TestBed.configureTestingModule({
      imports: [QuestionnaireAnswerPznComponent, TranslateModule.forRoot()],
      providers: [{ provide: BackButtonService, useValue: backButton }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerPznComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
