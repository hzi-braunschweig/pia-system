/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConsentInputTextComponent } from '../consent-input-text/consent-input-text.component';
import { format } from 'date-fns';
import { Subscription } from 'rxjs';
import {
  IonItem,
  IonInput,
  IonModal,
  IonContent,
  IonDatetime,
  Platform,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-consent-input-date',
  templateUrl: './consent-input-date.component.html',
  imports: [
    IonItem,
    NgIf,
    IonInput,
    IonModal,
    IonContent,
    IonDatetime,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class ConsentInputDateComponent
  extends ConsentInputTextComponent
  implements OnInit, OnDestroy
{
  displayValue: string;
  dateInputValue: string;

  private subscription: Subscription;

  constructor(public platform: Platform) {
    super();
  }

  public ngOnInit() {
    super.ngOnInit();

    this.setDisplayValue(this.formControl.value);
    this.setDateInputValue(this.formControl.value);

    this.subscription = this.formControl.valueChanges.subscribe((value) => {
      this.setDisplayValue(value);
      this.setDateInputValue(value);
    });
  }

  ngOnDestroy() {
    super.ngOnDestroy();
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private setDisplayValue(date: string | null): void {
    if (date) {
      this.displayValue = format(new Date(date), 'dd.MM.yyyy');
    }
  }

  private setDateInputValue(date: string | null): void {
    if (!date) {
      this.dateInputValue = '';
      return;
    }

    // Convert to Date and format as YYYY-MM-DD for native date input
    try {
      const dateObj = new Date(date);
      this.dateInputValue = format(dateObj, 'yyyy-MM-dd');
    } catch {
      this.dateInputValue = '';
    }
  }

  onDateInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.formControl.setValue(target.value);
  }
}
