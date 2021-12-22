/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ChangeDetectorRef, Component } from '@angular/core';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../questionnaire.model';
import { QuestionnaireClientService } from '../questionnaire-client.service';
import { BadgeService } from '../../shared/services/badge/badge.service';
import { ActivatedRoute, Router } from '@angular/router';

type Status = 'open' | 'closed';

@Component({
  selector: 'app-questionnaire-list',
  templateUrl: './questionnaire-list.page.html',
  styleUrls: ['./questionnaire-list.page.scss'],
})
export class QuestionnaireListPage {
  isLoading = true;
  questionnaireInstances: QuestionnaireInstance[] = [];
  selectedStatus: Status = 'open';

  constructor(
    private questionnnaireClient: QuestionnaireClientService,
    private badgeService: BadgeService,
    private router: Router,
    private route: ActivatedRoute,
    private changeRef: ChangeDetectorRef
  ) {
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status');
      switch (status) {
        case 'closed':
        case 'open':
          this.loadQuestionnaireInstancesForStatus(status);
          break;
        default:
          this.loadQuestionnaireInstancesForStatus('open');
          break;
      }
    });
  }

  private static countOpenQuestionnaires(
    questionnaireInstances: QuestionnaireInstance[]
  ): number {
    return questionnaireInstances.filter(
      (qsInstance) =>
        (qsInstance.status === 'active' ||
          qsInstance.status === 'in_progress') &&
        qsInstance.questionnaire.cycle_unit !== 'spontan'
    ).length;
  }

  async switchTab(event: Event) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: (event as CustomEvent<{ value: Status }>).detail.value,
      },
      queryParamsHandling: 'merge',
    });
  }

  async loadQuestionnaireInstancesForStatus(status: Status): Promise<void> {
    this.selectedStatus = status;
    const qiStatus: QuestionnaireStatus[] =
      status === 'closed'
        ? ['released_once', 'released_twice']
        : ['active', 'in_progress'];
    this.questionnaireInstances = [];
    this.isLoading = true;
    try {
      this.questionnaireInstances =
        await this.questionnnaireClient.getQuestionnaireInstances(qiStatus);
      if (status === 'open') {
        this.badgeService.set(
          QuestionnaireListPage.countOpenQuestionnaires(
            this.questionnaireInstances
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
    this.isLoading = false;
    this.changeRef.detectChanges();
  }
}
