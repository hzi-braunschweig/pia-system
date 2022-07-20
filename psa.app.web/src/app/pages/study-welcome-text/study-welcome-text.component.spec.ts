/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { StudyWelcomeTextComponent } from './study-welcome-text.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { TranslateModule } from '@ngx-translate/core';
import { UserService } from 'src/app/psa.app.core/providers/user-service/user.service';
import { AlertService } from '../../_services/alert.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Study } from '../../psa.app.core/models/study';
import { By } from '@angular/platform-browser';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { createStudy } from '../../psa.app.core/models/instance.helper.spec';

describe('StudyWelcomeTextComponent', () => {
  let component: StudyWelcomeTextComponent;
  let fixture: ComponentFixture<StudyWelcomeTextComponent>;
  let alertService: jasmine.SpyObj<AlertService>;
  let userService: jasmine.SpyObj<UserService>;

  const studyWelcomeTextObj = {
    study_id: 'Teststudie1',
    welcome_text: 'text',
    language: 'de_DE',
  };

  beforeEach(
    waitForAsync(() => {
      alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
      userService = jasmine.createSpyObj('UserService', [
        'getStudies',
        'getStudyWelcomeText',
      ]);

      userService.getStudies.and.returnValue(Promise.resolve(getStudies()));
      userService.getStudyWelcomeText.and.returnValue(
        Promise.resolve(studyWelcomeTextObj)
      );

      TestBed.configureTestingModule({
        providers: [
          { provide: UserService, useValue: userService },
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
          MatDialogModule,
          ReactiveFormsModule,
          TranslateModule.forRoot(),
        ],
      });
    })
  );

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

  function getStudies(): Study[] {
    return [
      createStudy({ name: 'Teststudie1' }),
      createStudy({ name: 'Teststudie2' }),
    ];
  }
});
