/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { QuestionnaireStatus } from '../questionnaire.model';

@Component({
  selector: 'app-questionnaire-progress-bar',
  templateUrl: './questionnaire-progress-bar.component.html',
  standalone: false,
})
export class QuestionnaireProgressBarComponent {
  @Input()
  progress: number;

  @Input()
  status: QuestionnaireStatus;
}
