/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  forwardRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { MatLegacyAutocompleteSelectedEvent as MatAutocompleteSelectedEvent } from '@angular/material/legacy-autocomplete';
import { MatLegacyChipInputEvent as MatChipInputEvent } from '@angular/material/legacy-chips';
import { Observable, Subscription } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

const CHIP_AUTOCOMPLETE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ChipAutocompleteComponent),
  multi: true,
};

@Component({
  selector: 'app-chip-autocomplete',
  templateUrl: './chip-autocomplete.component.html',
  styleUrls: ['./chip-autocomplete.component.scss'],
  providers: [CHIP_AUTOCOMPLETE_ACCESSOR],
})
export class ChipAutocompleteComponent
  implements ControlValueAccessor, OnChanges, OnDestroy
{
  @Input() public label: string;

  @Input() public placeholder: string;

  @Input() public allowedValues: string[] = [];

  @Input() public showError: boolean;

  @Input() public errorMessage: string;

  @ViewChild('valueInput') valueInput: ElementRef<HTMLInputElement>;

  @ViewChild('chipList') chipList;

  public separatorKeysCodes: number[] = [ENTER, COMMA];
  public filterFormControl = new FormControl('');
  public filteredValues: Observable<string[]>;
  public valuesFormControl = new FormControl([]);

  public onTouched: () => void = () => {};

  private subscription: Subscription;

  constructor() {
    this.filteredValues = this.filterFormControl.valueChanges.pipe(
      startWith(null),
      map((value: string | null) => this.filter(value))
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('allowedValues' in changes) {
      this.writeValue([]);
    }
    if ('showError' in changes && this.chipList) {
      this.chipList.errorState = this.showError;
    }
  }

  public ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  public registerOnChange(onChange: (value) => void) {
    this.subscription = this.valuesFormControl.valueChanges.subscribe(
      (value) => {
        this.filterFormControl.setValue(null);
        onChange(value);
      }
    );
  }

  public registerOnTouched(onTouched: () => void) {
    this.onTouched = onTouched;
  }

  public setDisabledState(isDisabled: boolean): void {
    isDisabled
      ? this.filterFormControl.disable()
      : this.filterFormControl.enable();
  }

  public writeValue(values: string[]): void {
    this.valuesFormControl.patchValue(values ?? []);
    if (this.valueInput?.nativeElement) {
      this.valueInput.nativeElement.value = '';
    }
  }

  public add(event: MatChipInputEvent): void {
    this.addValue((event.value || '').trim());

    event.chipInput.clear();
  }

  public remove(value: string): void {
    this.valuesFormControl.setValue(
      this.valuesFormControl.value.filter((formValue) => formValue !== value)
    );
  }

  public select(event: MatAutocompleteSelectedEvent): void {
    this.addValue(event.option.viewValue);
    this.valueInput.nativeElement.value = '';
  }

  public selectAll(): void {
    this.valuesFormControl.setValue(this.allowedValues);
  }

  private addValue(value: string) {
    if (
      value &&
      this.allowedValues.includes(value) &&
      !this.valuesFormControl.value.includes(value)
    ) {
      this.valuesFormControl.setValue([...this.valuesFormControl.value, value]);
    }
  }

  private filter(filterValue: string): string[] {
    return this.allowedValues.filter(
      (value) =>
        (!filterValue ||
          value.toLowerCase().includes(filterValue.toLowerCase())) &&
        !this.valuesFormControl.value.includes(value)
    );
  }
}
