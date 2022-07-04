/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConsentInputTextComponent } from '../consent-input-text/consent-input-text.component';
import { format } from 'date-fns';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-consent-input-date',
  templateUrl: './consent-input-date.component.html',
})
export class ConsentInputDateComponent
  extends ConsentInputTextComponent
  implements OnInit, OnDestroy
{
  displayValue: string;

  private subscription: Subscription;

  public ngOnInit() {
    super.ngOnInit();

    this.setDisplayValue(this.formControl.value);
    this.subscription = this.formControl.valueChanges.subscribe((value) => {
      this.setDisplayValue(value);
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
}
