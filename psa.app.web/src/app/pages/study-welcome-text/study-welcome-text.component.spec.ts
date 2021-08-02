/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  async,
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { StudyWelcomeTextComponent } from './study-welcome-text.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { TranslateModule } from '@ngx-translate/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../_services/alert.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Studie } from '../../psa.app.core/models/studie';
import { By } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';

describe('StudyWelcomeTextComponent', () => {
  let component: StudyWelcomeTextComponent;
  let fixture: ComponentFixture<StudyWelcomeTextComponent>;
  let alertService: jasmine.SpyObj<AlertService>;
  let questionnaireService: jasmine.SpyObj<QuestionnaireService>;

  const studyWelcomeTextObj = {
    study_id: 'Teststudie1',
    welcome_text: 'text',
    language: 'de_DE',
  };

  beforeEach(async(() => {
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    questionnaireService = jasmine.createSpyObj('QuestionnaireService', [
      'getStudies',
      'getStudyWelcomeText',
    ]);

    questionnaireService.getStudies.and.returnValue(
      Promise.resolve({ studies: getStudies() })
    );
    questionnaireService.getStudyWelcomeText.and.returnValue(
      Promise.resolve(studyWelcomeTextObj)
    );

    TestBed.configureTestingModule({
      providers: [
        { provide: QuestionnaireService, useValue: questionnaireService },
        { provide: AlertService, useValue: alertService },
      ],
      declarations: [StudyWelcomeTextComponent],
      imports: [
        BrowserAnimationsModule,
        FormsModule,
        MarkdownModule.forRoot(),
        MatCardModule,
        MatDatepickerModule,
        MatDividerModule,
        MatInputModule,
        MatListModule,
        MatSelectModule,
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
    });
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(StudyWelcomeTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the studies', () => {
    expect(component.studies).toEqual(getStudies());
  });

  it('should show the full component, when a study is selected', fakeAsync(() => {
    component.onSelectStudy(getStudies()[0]);
    tick();
    expect(component.selectedStudy).toEqual(getStudies()[0]);
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(By.css('[unit-welcome-text]'))
    ).toBeTruthy();
  }));

  function getStudies(): Studie[] {
    const studies = [new Studie(), new Studie()];
    studies[0].name = 'Teststudie1';
    studies[1].name = 'Teststudie2';
    return studies;
  }
});
