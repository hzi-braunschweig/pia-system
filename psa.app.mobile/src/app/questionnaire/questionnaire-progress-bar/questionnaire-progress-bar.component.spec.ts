/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuestionnaireProgressBarComponent } from './questionnaire-progress-bar.component';

describe('QuestionnaireProgressBarComponent', () => {
  let component: QuestionnaireProgressBarComponent;
  let fixture: ComponentFixture<QuestionnaireProgressBarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuestionnaireProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
