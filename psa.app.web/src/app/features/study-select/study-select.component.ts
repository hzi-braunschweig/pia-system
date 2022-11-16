/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, forwardRef, Input, OnDestroy, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  Validators,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { CurrentUser } from '../../_services/current-user.service';
import { filter, startWith } from 'rxjs/operators';

const STUDY_SELECT_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => StudySelectComponent),
  multi: true,
};

@Component({
  selector: 'app-study-select',
  templateUrl: './study-select.component.html',
  providers: [STUDY_SELECT_VALUE_ACCESSOR],
})
export class StudySelectComponent
  implements ControlValueAccessor, OnInit, OnDestroy
{
  @Input()
  public required: boolean = false;

  public selectedStudy: FormControl<string>;

  public availableStudies: string[] = this.currentUser.studies;

  private subscription: Subscription;

  constructor(private currentUser: CurrentUser) {}

  ngOnInit() {
    this.selectedStudy = new FormControl<string>(
      this.getSingleStudyOrNull(),
      this.required ? Validators.required : null
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  registerOnChange(onChange: (value: string) => void) {
    this.subscription = this.selectedStudy.valueChanges
      .pipe(startWith(this.selectedStudy.value), filter(Boolean))
      .subscribe((value) => onChange(value));
  }

  registerOnTouched(fn) {}

  writeValue(value: string) {
    // do not update with empty value if study is already selected
    // otherwise the preselected single study will be overwritten
    if (value && !this.selectedStudy.value) {
      this.selectedStudy.patchValue(value);
    }
  }

  /**
   * This will preselect the only study if the current
   * user is only assigned to one study
   */
  private getSingleStudyOrNull(): string | null {
    return this.currentUser.studies.length === 1
      ? this.currentUser.studies[0]
      : null;
  }
}
