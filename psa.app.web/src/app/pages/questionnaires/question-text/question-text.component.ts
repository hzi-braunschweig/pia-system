/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-question-text',
  templateUrl: './question-text.component.html',
  styleUrls: ['./question-text.component.scss'],
})
export class QuestionTextComponent {
  @Input() text: string;
  @Input() helpText: string | null;
}
