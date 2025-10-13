/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-questionnaire-question-text',
  templateUrl: './questionnaire-question-text.component.html',
  styleUrls: ['./questionnaire-question-text.component.scss'],
  standalone: false,
})
export class QuestionnaireQuestionTextComponent {
  @Input() text: string;
  @Input() helpText: string;
}
