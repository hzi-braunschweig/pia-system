/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatLegacyOption as MatOption } from '@angular/material/legacy-core';
import { MatLegacySelect as MatSelect } from '@angular/material/legacy-select';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'mat-select-search',
  templateUrl: 'mat-select-search.component.html',
  styleUrls: ['mat-select-search.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MatSelectSearchComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatSelectSearchComponent
  implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor
{
  /** Current search value */
  get value(): string {
    return this._value;
  }

  constructor(
    @Inject(MatSelect) public matSelect: MatSelect,
    private changeDetectorRef: ChangeDetectorRef
  ) {}
  /** Label of the search placeholder */
  @Input() placeholderLabel = 'Suche';

  /** Label to be shown when no entries are found. Set to null if no message should be shown. */
  @Input() noEntriesFoundLabel = 'Keine Optionen gefunden';

  /** Reference to the search input field */
  @ViewChild('searchSelectInput', { read: ElementRef, static: true })
  searchSelectInput: ElementRef;
  private _value: string;

  /** Reference to the MatSelect options */
  public _options: QueryList<MatOption>;

  /** Previously selected values when using <mat-select [multiple]="true"> */
  private previousSelectedValues: any[];

  /** Whether the backdrop class has been set */
  private overlayClassSet = false;

  /** Event that emits when the current value changes */
  private change = new EventEmitter<string>();

  /** Subject that emits when the component has been destroyed. */
  private _onDestroy = new Subject<void>();

  onChange = (_: any) => {};
  onTouched = (_: any) => {};

  ngOnInit(): void {
    // set custom panel class
    const panelClass = 'mat-select-search-panel';
    if (this.matSelect.panelClass) {
      if (Array.isArray(this.matSelect.panelClass)) {
        this.matSelect.panelClass.push(panelClass);
      } else if (typeof this.matSelect.panelClass === 'string') {
        this.matSelect.panelClass = [this.matSelect.panelClass, panelClass];
      } else if (typeof this.matSelect.panelClass === 'object') {
        this.matSelect.panelClass[panelClass] = true;
      }
    } else {
      this.matSelect.panelClass = panelClass;
    }

    // when the select dropdown panel is opened or closed
    this.matSelect.openedChange
      .pipe(takeUntil(this._onDestroy))
      .subscribe((opened) => {
        if (opened) {
          // focus the search field when opening
          this._focus();
        } else {
          // clear it when closing
          this._reset();
        }
      });

    // set the first item active after the options changed
    this.matSelect.openedChange
      .pipe(take(1))
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        this._options = this.matSelect.options;
        this._options.changes.pipe(takeUntil(this._onDestroy)).subscribe(() => {
          const keyManager = this.matSelect._keyManager;
          if (keyManager && this.matSelect.panelOpen) {
            // avoid "expression has been changed" error
            setTimeout(() => {
              keyManager.setFirstItemActive();
            });
          }
        });
      });

    // detect changes when the input changes
    this.change.pipe(takeUntil(this._onDestroy)).subscribe(() => {
      this.changeDetectorRef.detectChanges();
    });

    // this.initMultipleHandling();
  }

  ngOnDestroy(): void {
    this._onDestroy.next();
    this._onDestroy.complete();
  }

  ngAfterViewInit(): void {
    this.setOverlayClass();
  }

  /**
   * Handles the key down event with MatSelect.
   * Allows e.g. selecting with enter key, navigation with arrow keys, etc.
   */
  _handleKeydown(event: KeyboardEvent): void {
    if (event.keyCode === 32) {
      // do not propagate spaces to MatSelect, as this would select the currently active option
      event.stopPropagation();
    }
  }

  writeValue(value: string): void {
    const valueChanged = value !== this._value;
    if (valueChanged) {
      this._value = value;
      this.change.emit(value);
    }
  }

  onInputChange(value): void {
    const valueChanged = value !== this._value;
    if (valueChanged) {
      this._value = value;
      this.onChange(value);
      this.change.emit(value);
    }
  }

  onBlur(value: string): void {
    this.writeValue(value);
    this.onTouched(undefined);
  }

  registerOnChange(fn: () => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * Focuses the search input field
   */
  public _focus(): void {
    if (!this.searchSelectInput) {
      return;
    }
    this.searchSelectInput.nativeElement.focus();
  }

  /**
   * Resets the current search value
   * @param focus whether to focus after resetting
   */
  public _reset(focus?: boolean): void {
    if (!this.searchSelectInput) {
      return;
    }
    this.searchSelectInput.nativeElement.value = '';
    this.onInputChange('');
    if (focus) {
      this._focus();
    }
  }

  /**
   * Sets the overlay class  to correct offsetY
   * so that the selected option is at the position of the select box when opening
   */
  private setOverlayClass(): void {
    if (this.overlayClassSet) {
      return;
    }
    const overlayClass = 'cdk-overlay-pane-select-search';

    // @ts-ignore
    this.matSelect._overlayDir.attach
      .pipe(takeUntil(this._onDestroy))
      .subscribe(() => {
        // note: this is hacky, but currently there is no better way to do this
        this.searchSelectInput.nativeElement.parentElement.parentElement.parentElement.parentElement.parentElement.classList.add(
          overlayClass
        );
      });

    this.overlayClassSet = true;
  }

  /**
   * Initializes handling <mat-select [multiple]="true">
   * Note: to improve this code, mat-select should be extended to allow disabling resetting the selection while filtering.
   */
  private initMultipleHandling(): void {
    // if <mat-select [multiple]="true">
    // store previously selected values and restore them when they are deselected
    // because the option is not available while we are currently filtering
    this.matSelect.valueChange
      .pipe(takeUntil(this._onDestroy))
      .subscribe((values) => {
        if (this.matSelect.multiple) {
          let restoreSelectedValues = false;
          if (
            this._value &&
            this._value.length &&
            this.previousSelectedValues &&
            Array.isArray(this.previousSelectedValues)
          ) {
            if (!values || !Array.isArray(values)) {
              values = [];
            }
            const optionValues = this.matSelect.options.map(
              (option) => option.value
            );
            this.previousSelectedValues.forEach((previousValue) => {
              if (
                values.indexOf(previousValue) === -1 &&
                optionValues.indexOf(previousValue) === -1
              ) {
                // if a value that was selected before is deselected and not found in the options, it was deselected
                // due to the filtering, so we restore it.
                values.push(previousValue);
                restoreSelectedValues = true;
              }
            });
          }

          if (restoreSelectedValues) {
            this.matSelect._onChange(values);
          }

          this.previousSelectedValues = values;
        }
      });
  }
}
