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
import { QuestionnaireAnswerInputDatetimeComponent } from './questionnaire-answer-input-datetime.component';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { Platform } from '@ionic/angular/standalone';

describe('QuestionnaireAnswerInputDatetimeComponent', () => {
  let component: QuestionnaireAnswerInputDatetimeComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerInputDatetimeComponent>;
  let platformSpy: jasmine.SpyObj<Platform>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('Platform', ['is']);

    TestBed.configureTestingModule({
      imports: [
        QuestionnaireAnswerInputDatetimeComponent,
        TranslateModule.forRoot(),
      ],
      providers: [{ provide: Platform, useValue: spy }],
    }).compileComponents();

    platformSpy = TestBed.inject(Platform) as jasmine.SpyObj<Platform>;
  });

  describe('hybrid platform', () => {
    beforeEach(() => {
      platformSpy.is.and.returnValue(true);
      fixture = TestBed.createComponent(
        QuestionnaireAnswerInputDatetimeComponent
      );
      component = fixture.componentInstance;
      component.name = 'test-date';
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

    it('should show placeholder text when no date is set', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const displayValueElement = fixture.debugElement.query(
        By.css('[data-unit="display-value"]')
      ).nativeElement;

      expect(displayValueElement.value).toContain('GENERAL.PLEASE_CLICK');
      flush();
    }));
  });

  describe('non-hybrid platform', () => {
    beforeEach(() => {
      platformSpy.is.and.returnValue(false);
      fixture = TestBed.createComponent(
        QuestionnaireAnswerInputDatetimeComponent
      );
      component = fixture.componentInstance;
      component.name = 'test-date';
      fixture.detectChanges();
    });

    it('should display date in native input format', fakeAsync(() => {
      component.writeValue(new Date('2022-05-01'));

      tick();
      fixture.detectChanges();

      const dateInputElement = fixture.debugElement.query(
        By.css('input[type="date"]')
      ).nativeElement;

      expect(dateInputElement.value).toEqual('2022-05-01');
      flush();
    }));

    it('should handle empty date value', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const dateInputElement = fixture.debugElement.query(
        By.css('input[type="date"]')
      ).nativeElement;

      expect(dateInputElement.value).toEqual('');
      flush();
    }));

    it('should update form control when native input changes', fakeAsync(() => {
      const dateInputElement = fixture.debugElement.query(
        By.css('input[type="date"]')
      ).nativeElement;

      // Simulate user input
      dateInputElement.value = '2023-06-15';
      dateInputElement.dispatchEvent(new Event('change'));

      tick();
      fixture.detectChanges();

      // The control should contain an ISO string
      expect(component.control.value).toEqual('2023-06-15T00:00:00.000Z');
      flush();
    }));
  });
});
