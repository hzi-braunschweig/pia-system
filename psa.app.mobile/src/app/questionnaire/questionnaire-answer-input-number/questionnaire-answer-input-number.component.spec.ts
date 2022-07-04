/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';

import { QuestionnaireAnswerInputNumberComponent } from './questionnaire-answer-input-number.component';
import SpyObj = jasmine.SpyObj;

describe('QuestionnaireAnswerInputNumberComponent', () => {
  let component: QuestionnaireAnswerInputNumberComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerInputNumberComponent>;

  let keyboard: SpyObj<Keyboard>;

  beforeEach(() => {
    keyboard = jasmine.createSpyObj('Keyboard', ['hide']);

    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerInputNumberComponent],
      imports: [IonicModule.forRoot()],
      providers: [{ provide: Keyboard, useValue: keyboard }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerInputNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
