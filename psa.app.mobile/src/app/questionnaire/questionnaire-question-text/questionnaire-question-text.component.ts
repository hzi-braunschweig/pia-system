/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import { addIcons } from 'ionicons';
import { helpCircleOutline } from 'ionicons/icons';
import { MarkdownComponent } from 'ngx-markdown';
import { NgIf } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-questionnaire-question-text',
  templateUrl: './questionnaire-question-text.component.html',
  styleUrls: ['./questionnaire-question-text.component.scss'],
  imports: [MarkdownComponent, NgIf, IonIcon],
})
export class QuestionnaireQuestionTextComponent {
  @Input() text: string;
  @Input() helpText: string;

  constructor() {
    addIcons({ helpCircleOutline });
  }
}
