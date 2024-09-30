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
} from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireAnswerSingleSelectComponent } from './questionnaire-answer-single-select.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

describe('QuestionnaireAnswerSingleSelectComponent', () => {
  let component: QuestionnaireAnswerSingleSelectComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerSingleSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerSingleSelectComponent],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerSingleSelectComponent);
    component = fixture.componentInstance;
    component.control = new FormControl('');
    component.values = ['Option 1', 'Option 2', 'Option 3'];
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Autocomplete mode', () => {
    beforeEach(() => {
      component.useAutocomplete = true;
      fixture.detectChanges();
    });

    it('should display input when in autocomplete mode', () => {
      const inputElement = fixture.nativeElement.querySelector('ion-input');
      expect(inputElement).toBeTruthy();
    });

    it('should filter values on input', () => {
      const inputElement = fixture.nativeElement.querySelector('ion-input');
      component.control.setValue('Option 1');
      inputElement.dispatchEvent(
        new CustomEvent('ionInput', { detail: { value: 'Option 1' } })
      );
      expect(component.filteredValues).toEqual(['Option 1']);
    });

    it('should select value when clicking an option', () => {
      component.showAutocompleteOptions = true;
      fixture.detectChanges();
      const optionElement =
        fixture.nativeElement.querySelector('ion-item[button]');
      optionElement.click();
      expect(component.control.value).toBe('Option 1');
    });

    describe('validateAutocompleteInput', () => {
      it('should clear the input if the value is not in the options list', fakeAsync(() => {
        component.control.setValue('Invalid Option');
        component.validateAutocompleteInput();
        tick(150);
        expect(component.control.value).toBe('');
      }));

      it('should not clear the input if the value is in the options list', fakeAsync(() => {
        component.control.setValue('Option 1');
        component.validateAutocompleteInput();
        tick(150);
        expect(component.control.value).toBe('Option 1');
      }));

      it('should not clear the input if isOptionSelected is true', fakeAsync(() => {
        component.isOptionSelected = true;
        component.control.setValue('Invalid Option');
        component.validateAutocompleteInput();
        tick(150);
        expect(component.control.value).toBe('Invalid Option');
      }));

      it('should hide autocomplete options after validation', fakeAsync(() => {
        component.validateAutocompleteInput();
        tick(150);
        expect(component.showAutocompleteOptions).toBeFalse();
      }));

      it('should reset isOptionSelected after validation', fakeAsync(() => {
        component.isOptionSelected = true;
        component.validateAutocompleteInput();
        tick(150);
        expect(component.isOptionSelected).toBeFalse();
      }));
    });
  });

  describe('Radio button mode', () => {
    beforeEach(() => {
      component.useAutocomplete = false;
      fixture.detectChanges();
    });

    it('should display radio buttons when not in autocomplete mode', () => {
      const radioGroup = fixture.nativeElement.querySelector('ion-radio-group');
      expect(radioGroup).toBeTruthy();
    });

    it('should have the correct number of radio buttons', () => {
      const radioButtons = fixture.nativeElement.querySelectorAll('ion-radio');
      expect(radioButtons.length).toBe(3);
    });
  });
});
