/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { QuestionnaireAnswerTimestampComponent } from './questionnaire-answer-timestamp.component';

describe('QuestionnaireAnswerTimestampComponent', () => {
  let component: QuestionnaireAnswerTimestampComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerTimestampComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        QuestionnaireAnswerTimestampComponent,
        TranslateModule.forRoot(),
      ],
      providers: [],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerTimestampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
