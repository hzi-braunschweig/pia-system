/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { QuestionnaireAnswerErrorComponent } from './questionnaire-answer-error.component';

describe('QuestionnaireAnswerErrorComponent', () => {
  let component: QuestionnaireAnswerErrorComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerErrorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuestionnaireAnswerErrorComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
