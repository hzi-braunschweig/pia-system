/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonBackButton,
  IonTitle,
} from '@ionic/angular/standalone';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [
    IonHeader,
    IonToolbar,
    IonButtons,
    NgIf,
    IonMenuButton,
    IonBackButton,
    IonTitle,
  ],
})
export class HeaderComponent {
  @Input()
  title: string;

  @Input()
  isChildPageOf: string;

  @Input()
  disableButtons: boolean;
}
