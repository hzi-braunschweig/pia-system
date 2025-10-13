/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { QuestionnaireAnswerMultiSelectComponent } from './questionnaire-answer-multi-select.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

describe('QuestionnaireAnswerMultiSelectComponent', () => {
  let component: QuestionnaireAnswerMultiSelectComponent;
  let fixture: ComponentFixture<QuestionnaireAnswerMultiSelectComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [QuestionnaireAnswerMultiSelectComponent],
      imports: [
        IonicModule.forRoot(),
        ReactiveFormsModule,
        TranslateModule.forRoot(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuestionnaireAnswerMultiSelectComponent);
    component = fixture.componentInstance;
    component.values = ['Option 0', 'Option 1', 'Option 2'];
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

    it('should display input when in autocomplete mode and not checkbox', () => {
      const radioGroup = fixture.nativeElement.querySelector('ion-checkbox');
      expect(radioGroup).toBeFalsy();

      const inputElement = fixture.nativeElement.querySelector('ion-input');
      expect(inputElement).toBeTruthy();
    });

    it('should filter values on input', () => {
      const inputElement = fixture.nativeElement.querySelector('ion-input');
      inputElement.dispatchEvent(
        new CustomEvent('ionInput', { detail: { value: 'Option 0' } })
      );
      expect(component.filteredValues).toEqual(['Option 0']);
    });

    it('should select value when clicking an option', () => {
      component.showAutocompleteOptions = true;
      fixture.detectChanges();
      const optionElement =
        fixture.nativeElement.querySelector('ion-item[button]');
      optionElement.click();
      expect(component.form.controls[0].value).toBe(true);
      expect(component.form.controls[1].value).toBe(false);
      expect(component.form.controls[2].value).toBe(false);
    });

    it('should select another value when clicking an additional option', () => {
      component.form.controls[1].setValue(true);
      component.showAutocompleteOptions = true;
      fixture.detectChanges();
      const optionElement =
        fixture.nativeElement.querySelector('ion-item[button]');
      optionElement.click();
      expect(component.form.controls[0].value).toBe(true);
      expect(component.form.controls[1].value).toBe(true);
      expect(component.form.controls[2].value).toBe(false);
    });

    it('should show value when selected', () => {
      component.form.controls[1].setValue(true);
      component.form.controls[2].setValue(true);
      fixture.detectChanges();
      const chipElements = fixture.nativeElement.querySelectorAll('ion-chip');
      const chipTexts = Array.from(chipElements).map(
        (chipElement: HTMLElement) => chipElement.textContent.trim()
      );
      expect(chipElements.length).toBe(2);
      expect(chipTexts).toContain('Option 1');
      expect(chipTexts).toContain('Option 2');
    });

    it('should deselect a value when selected', () => {
      component.form.controls[1].setValue(true);
      component.form.controls[2].setValue(true);
      fixture.detectChanges();
      component.deselectValue('Option 1');
      fixture.detectChanges();
      expect(component.form.controls[0].value).toBe(false);
      expect(component.form.controls[1].value).toBe(false);
      expect(component.form.controls[2].value).toBe(true);
    });
  });

  describe('Radio button mode', () => {
    beforeEach(() => {
      component.useAutocomplete = false;
      fixture.detectChanges();
    });

    it('should display checkbox when not in autocomplete mode and not input', () => {
      const inputElement = fixture.nativeElement.querySelector('ion-input');
      expect(inputElement).toBeFalsy();

      const radioGroup = fixture.nativeElement.querySelector('ion-checkbox');
      expect(radioGroup).toBeTruthy();
    });

    it('should have the correct number of checkbox buttons', () => {
      const radioButtons =
        fixture.nativeElement.querySelectorAll('ion-checkbox');
      expect(radioButtons.length).toBe(3);
    });
  });
});
