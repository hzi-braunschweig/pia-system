/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Input, OnInit } from '@angular/core';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../questionnaire.model';

@Component({
  selector: 'app-questionnaire-instances-list',
  templateUrl: './questionnaire-instances-list.component.html',
  styleUrls: ['./questionnaire-instances-list.component.scss'],
})
export class QuestionnaireInstancesListComponent implements OnInit {
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
    const instancesResult = questionnaireInstances.sort(
      this.compareQuestionnaireInstances
    );
    this.spontanQuestionnaireInstances = instancesResult.filter(
      this.isForSpontanList
    );
    this.otherQuestionnaireInstances = instancesResult.filter(
      (instance) => !this.isForSpontanList(instance)
    );
  }

  ngOnInit() {}

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

  private compareQuestionnaireInstances(
    a: QuestionnaireInstance,
    b: QuestionnaireInstance
  ): number {
    if (
      QuestionnaireInstancesListComponent.order.get(a.status) !==
      QuestionnaireInstancesListComponent.order.get(b.status)
    ) {
      return (
        QuestionnaireInstancesListComponent.order.get(a.status) -
        QuestionnaireInstancesListComponent.order.get(b.status)
      );
    }
    if (a.date_of_issue > b.date_of_issue) {
      return -1;
    } else if (a.date_of_issue < b.date_of_issue) {
      return 1;
    }
    return 0;
  }
}
