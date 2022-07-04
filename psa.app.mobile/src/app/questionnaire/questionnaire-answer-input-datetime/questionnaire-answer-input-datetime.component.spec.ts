/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireAnswerInputDatetimeComponent } from './questionnaire-answer-input-datetime.component';
import { MockPipe } from 'ng-mocks';
import { TranslatePipe } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';

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

  it('should display a formatted date', fakeAsync(() => {
    component.writeValue(new Date('2022-05-01'));

    tick();
    fixture.detectChanges();

    const displayValueElement = fixture.debugElement.query(
      By.css('[data-unit="display-value"]')
    ).nativeElement;

    expect(displayValueElement.value).toEqual('01.05.2022');
    flush();
  }));
});
