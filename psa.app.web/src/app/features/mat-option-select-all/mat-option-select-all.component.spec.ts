/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { MatOptionSelectAllComponent } from './mat-option-select-all.component';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatPseudoCheckbox } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { MockComponent } from 'ng-mocks';
import { NEVER } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('MatOptionSelectAllComponent', () => {
  let component: MatOptionSelectAllComponent;
  let fixture: ComponentFixture<MatOptionSelectAllComponent>;

  let matSelect;
  let valueFormControl: FormControl;

  beforeEach(() => {
    valueFormControl = new FormControl([]);
    matSelect = {
      options: {
        map: () => ['Option1', 'Option2', 'Option3'],
        changes: NEVER,
      },
      ngControl: {
        control: valueFormControl,
        valueChanges: valueFormControl.valueChanges,
      },
    };

    TestBed.configureTestingModule({
      declarations: [
        MatOptionSelectAllComponent,
        MockComponent(MatPseudoCheckbox),
      ],
      providers: [{ provide: MatSelect, useValue: matSelect }],
    });
    fixture = TestBed.createComponent(MatOptionSelectAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should select all options when none are currently selected', async () => {
    await fixture.whenStable();
    expect(component.state).toEqual('unchecked');
    clickOptionCheckbox();
    expect(matSelect.ngControl.control.value).toEqual([
      'Option1',
      'Option2',
      'Option3',
    ]);
    expect(component.state).toEqual('checked');
  });

  it('should select all options when some are currently selected', async () => {
    valueFormControl.setValue(['Option2', 'Option3']);
    await fixture.whenStable();
    expect(component.state).toEqual('indeterminate');
    clickOptionCheckbox();
    expect(matSelect.ngControl.control.value).toEqual([
      'Option1',
      'Option2',
      'Option3',
    ]);
    expect(component.state).toEqual('checked');
  });

  it('should unselect all options when all are currently selected', async () => {
    valueFormControl.setValue(['Option1', 'Option2', 'Option3']);
    await fixture.whenStable();
    expect(component.state).toEqual('checked');
    clickOptionCheckbox();
    expect(matSelect.ngControl.control.value).toEqual([]);
    expect(component.state).toEqual('unchecked');
  });

  function clickOptionCheckbox(): void {
    fixture.debugElement.query(By.css('.mat-option')).nativeElement.click();
  }
});
