/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { ConsentInputTextComponent } from '../consent-input-text/consent-input-text.component';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import {
  AppDateAdapter,
  APP_DATE_FORMATS_LONG,
} from '../../../../_helpers/date-adapter';

@Component({
  selector: 'app-consent-input-date',
  templateUrl: './consent-input-date.component.html',
  providers: [
    {
      provide: DateAdapter,
      useClass: AppDateAdapter,
    },
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS_LONG },
  ],
})
export class ConsentInputDateComponent extends ConsentInputTextComponent {}
