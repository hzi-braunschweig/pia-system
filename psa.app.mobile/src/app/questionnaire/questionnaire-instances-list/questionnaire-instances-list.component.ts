/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input } from '@angular/core';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../questionnaire.model';
import { compareQuestionnaireInstances } from './compare-questionnaire-instances';

@Component({
  selector: 'app-questionnaire-instances-list',
  templateUrl: './questionnaire-instances-list.component.html',
  styleUrls: ['./questionnaire-instances-list.component.scss'],
})
export class QuestionnaireInstancesListComponent {
  private static readonly order = new Map<QuestionnaireStatus, number>([
    ['in_progress', 1],
    ['active', 2],
    ['released', 3],
    ['released_once', 3],
    ['released_twice', 3],
  ]);
  spontanQuestionnaireInstances: QuestionnaireInstance[] = [];
  otherQuestionnaireInstances: QuestionnaireInstance[] = [];

  constructor() {}

  @Input() set questionnaireInstances(
    questionnaireInstances: QuestionnaireInstance[]
  ) {
    if (!questionnaireInstances) {
      return;
    }
    const instancesResult = questionnaireInstances.toSorted(
      compareQuestionnaireInstances
    );
    this.spontanQuestionnaireInstances = instancesResult.filter(
      this.isForSpontanList
    );
    this.otherQuestionnaireInstances = instancesResult.filter(
      (instance) => !this.isForSpontanList(instance)
    );
  }

  isEmpty() {
    return (
      !this.spontanQuestionnaireInstances.length &&
      !this.otherQuestionnaireInstances.length
    );
  }

  private isForSpontanList(instance): boolean {
    return (
      instance.questionnaire.cycle_unit === 'spontan' &&
      (instance.status === 'active' || instance.status === 'in_progress')
    );
  }
}
