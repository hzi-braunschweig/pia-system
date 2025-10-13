/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';

import { QuestionnaireAnswerTimestampComponent } from './questionnaire-answer-timestamp.component';

describe('QuestionnaireAnswerTimestampComponent', () => {
  let component: QuestionnaireAnswerTimestampComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerTimestampComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        QuestionnaireAnswerTimestampComponent,
        MockPipe(TranslatePipe),
      ],
      imports: [IonicModule.forRoot()],
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
