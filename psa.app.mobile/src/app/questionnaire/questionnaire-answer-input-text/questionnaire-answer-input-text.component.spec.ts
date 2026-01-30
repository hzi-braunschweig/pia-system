/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionnaireAnswerInputTextComponent } from './questionnaire-answer-input-text.component';

describe('QuestionnaireAnswerInputTextComponent', () => {
  let component: QuestionnaireAnswerInputTextComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerInputTextComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuestionnaireAnswerInputTextComponent],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerInputTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
