/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireAnswerInputDatetimeComponent } from './questionnaire-answer-input-datetime.component';
import { MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';

describe('QuestionnaireAnswerInputDatetimeComponent', () => {
  let component: QuestionnaireAnswerInputDatetimeComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerInputDatetimeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireAnswerInputDatetimeComponent,
        MockPipe(TranslatePipe),
      ],
      imports: [IonicModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(
      QuestionnaireAnswerInputDatetimeComponent
    );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
