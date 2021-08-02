/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { ConsentInputTextComponent } from '../consent-input-text/consent-input-text.component';

@Component({
  selector: 'app-consent-input-date',
  templateUrl: './consent-input-date.component.html',
})
export class ConsentInputDateComponent extends ConsentInputTextComponent {}
