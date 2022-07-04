/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Keyboard } from '@awesome-cordova-plugins/keyboard/ngx';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireAnswerInputTextComponent } from './questionnaire-answer-input-text.component';

describe('QuestionnaireAnswerInputTextComponent', () => {
  let component: QuestionnaireAnswerInputTextComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerInputTextComponent>;

  let keyboard: SpyObj<Keyboard>;

  beforeEach(() => {
    keyboard = jasmine.createSpyObj('Keyboard', ['hide']);

    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerInputTextComponent],
      imports: [IonicModule.forRoot()],
      providers: [{ provide: Keyboard, useValue: keyboard }],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerInputTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
