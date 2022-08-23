/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { parse } from 'date-fns';

@Component({
  selector: 'app-timestamp-answer-option',
  templateUrl: './timestamp-answer-option.component.html',
  styleUrls: ['timestamp-answer-option.component.scss'],
})
export class TimestampAnswerOptionComponent {
  @Input()
  timestamp: any;

  @Output()
  timestampChanged = new EventEmitter();

  @Input()
  hideButton = false;

  setTimestamp(): void {
    this.timestamp = Date.now();
    this.timestampChanged.emit(this.timestamp);
  }

  textInputBlurred(value): void {
    this.timestamp = parse(value, 'HH:mm dd.MM.yy', new Date());
    this.timestampChanged.emit(this.timestamp);
  }
}
