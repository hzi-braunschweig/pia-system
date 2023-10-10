/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipAutocompleteComponent } from './chip-autocomplete.component';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import {
  MatLegacyChipInputEvent as MatChipInputEvent,
  MatLegacyChipsModule as MatChipsModule,
} from '@angular/material/legacy-chips';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatLegacyInputHarness as MatInputHarness } from '@angular/material/legacy-input/testing';
import { MatLegacyAutocompleteHarness as MatAutocompleteHarness } from '@angular/material/legacy-autocomplete/testing';
import { MatLegacyChipHarness as MatChipHarness } from '@angular/material/legacy-chips/testing';
import { MatLegacyFormFieldHarness as MatFormFieldHarness } from '@angular/material/legacy-form-field/testing';
import { By } from '@angular/platform-browser';

@Component({
  selector: 'app-test-chip-autocomplete',
  template: `<app-chip-autocomplete
    label="Autocomplete Test"
    [formControl]="control"
    [allowedValues]="allowedValues"
    [showError]="showError"
    [errorMessage]="errorMessage"
  ></app-chip-autocomplete>`,
})
class TestChipAutocompleteComponent {
  control = new FormControl([]);
  allowedValues = ['Apple', 'Banana', 'Grape', 'Orange', 'Lemon'];
  showError = false;
  errorMessage = 'this is an error';
}

describe('ChipAutocompleteComponent', () => {
  let component: TestChipAutocompleteComponent;
  let fixture: ComponentFixture<TestChipAutocompleteComponent>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatChipsModule,
        MatIconModule,
        NoopAnimationsModule,
      ],
      declarations: [
        TestChipAutocompleteComponent,
        ChipAutocompleteComponent,
        MockPipe(TranslatePipe, (value) => value),
      ],
      providers: [],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestChipAutocompleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('should show initial form control values', async () => {
    component.control.setValue(['Banana', 'Lemon']);
    fixture.detectChanges();

    const chips = await loader.getAllHarnesses(MatChipHarness);
    expect(chips.length).toEqual(2);

    // check existence of correct values
    await loader.getHarness(MatChipHarness.with({ text: 'Banana' }));
    await loader.getHarness(MatChipHarness.with({ text: 'Lemon' }));
  });

  it('should handle initial null values', () => {
    component.control.setValue(null);
    expect(component.control.value).toEqual([]);
  });

  it('should update the form control if a value was selected', async () => {
    await triggerAutocompleteByInputFocus();

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
    await autocompleteHarness.selectOption({ text: 'Apple' });

    expect(component.control.value).toEqual(['Apple']);
  });

  it('should update the form control if a value was entered via input', async () => {
    const autocompleteComponent: ChipAutocompleteComponent =
      fixture.debugElement.children[0].componentInstance;

    autocompleteComponent.add(createMatChipInputEvent());

    expect(component.control.value).toEqual(['Apple']);
  });

  it('should filter the autocomplete options', async () => {
    const input = await triggerAutocompleteByInputFocus();
    await input.setValue('ra');

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
    const options = await autocompleteHarness.getOptions();

    expect(options.length).toEqual(3);
    expect(await options[1].getText()).toEqual('Grape');
    expect(await options[2].getText()).toEqual('Orange');
  });

  it('should have a select all option', async () => {
    await triggerAutocompleteByInputFocus();

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
    await autocompleteHarness.selectOption({ text: 'CONTACTS.SELECT_ALL' });

    expect(component.control.value).toEqual(component.allowedValues);
  });

  it('should remove a value from the form on button click', async () => {
    component.control.setValue(['Banana', 'Lemon']);
    fixture.detectChanges();

    const bananaChip = await loader.getHarness(
      MatChipHarness.with({ text: 'Banana' })
    );
    await bananaChip.remove();

    expect(component.control.value).toEqual(['Lemon']);
  });

  it('should show not show already selected values as autocomplete', async () => {
    component.control.setValue(['Banana', 'Grape', 'Orange', 'Lemon']);
    fixture.detectChanges();
    await triggerAutocompleteByInputFocus();

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
    const options = await autocompleteHarness.getOptions();

    expect(options.length).toEqual(2);
    expect(await options[0].getText()).toEqual('CONTACTS.SELECT_ALL');
    expect(await options[1].getText()).toEqual('Apple');
  });

  it('should empty the form control value if allowedValues changes', async () => {
    component.control.setValue(['Banana', 'Lemon']);

    component.allowedValues = ['Tomato', 'Cucumber'];

    const chips = await loader.getAllHarnesses(MatChipHarness);
    expect(chips.length).toEqual(0);
    expect(component.control.value).toEqual([]);
  });

  it('should update the autocomplete if allowedValues changes', async () => {
    component.control.setValue(['Banana', 'Lemon']);
    component.allowedValues = ['Tomato', 'Cucumber'];

    await triggerAutocompleteByInputFocus();

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
    const options = await autocompleteHarness.getOptions();

    expect(options.length).toEqual(3);
    expect(await options[1].getText()).toEqual('Tomato');
    expect(await options[2].getText()).toEqual('Cucumber');
  });

  it('should show an error message on blur', async () => {
    component.showError = true;
    const input = await triggerAutocompleteByInputFocus();
    await input.blur();

    const formFieldHarness = await loader.getHarness(MatFormFieldHarness);
    const errors = await formFieldHarness.getTextErrors();
    expect(errors).toContain(component.errorMessage);
  });

  it('should not allow input if form control is disabled', async () => {
    component.control.disable();

    const input = await triggerAutocompleteByInputFocus();
    expect(await input.isDisabled()).toBeTrue();

    const autocompleteHarness = await loader.getHarness(MatAutocompleteHarness);
    expect(await autocompleteHarness.isOpen()).toBeFalse();
  });

  async function triggerAutocompleteByInputFocus(): Promise<MatInputHarness> {
    const input = await loader.getHarness(MatInputHarness);
    await (await input.host()).dispatchEvent('focusin');
    return input;
  }

  function createMatChipInputEvent(): MatChipInputEvent {
    const inputElement = fixture.debugElement.children[0].query(
      By.css('[matInput]')
    ).nativeElement;
    return {
      input: inputElement,
      value: ' Apple ',
      chipInput: { clear: () => {} },
    } as MatChipInputEvent;
  }
});
