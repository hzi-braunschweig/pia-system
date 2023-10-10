/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { MatPseudoCheckboxState } from '@angular/material/core';
import { MatLegacySelect as MatSelect } from '@angular/material/legacy-select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mat-option-select-all',
  template: `
    <div class="mat-option" (click)="onSelectAll()">
      <mat-pseudo-checkbox
        [state]="state"
        class="mat-option-pseudo-checkbox"
      ></mat-pseudo-checkbox>
      <span class="mat-option-text"><ng-content></ng-content></span>
    </div>
  `,
  styles: [
    `
      .mat-option {
        border-bottom: 1px solid #ccc;
        height: 3.5em;
        line-height: 3.5em;
      }
    `,
  ],
})
export class MatOptionSelectAllComponent implements AfterViewInit, OnDestroy {
  state: MatPseudoCheckboxState = 'checked';

  private options = [];
  private value = [];

  private destroyed = new Subject();

  constructor(private matSelect: MatSelect) {}

  ngAfterViewInit(): void {
    this.options = this.matSelect.options.map((x) => x.value);
    this.matSelect.options.changes
      .pipe(takeUntil(this.destroyed))
      .subscribe((res) => {
        this.options = this.matSelect.options.map((x) => x.value);
        this.updateState();
      });

    this.value = this.matSelect.ngControl.control.value;
    this.matSelect.ngControl.valueChanges
      .pipe(takeUntil(this.destroyed))
      .subscribe((res) => {
        this.value = res;
        this.updateState();
      });
    // ExpressionChangedAfterItHasBeenCheckedError fix...
    setTimeout(() => {
      this.updateState();
    });
  }

  ngOnDestroy(): void {
    this.destroyed.next(undefined);
    this.destroyed.complete();
  }

  onSelectAll(): void {
    this.matSelect.ngControl.control.setValue(
      this.state === 'checked' ? [] : this.options
    );
  }

  private updateState(): void {
    if (this.value.length === this.options.length) {
      this.state = 'checked';
    } else if (this.value.length > 0) {
      this.state = 'indeterminate';
    } else {
      this.state = 'unchecked';
    }
  }
}
