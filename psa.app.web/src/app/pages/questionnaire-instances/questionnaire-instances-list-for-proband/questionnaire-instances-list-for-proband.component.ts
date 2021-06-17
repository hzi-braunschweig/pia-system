import { Component, OnInit } from '@angular/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute } from '@angular/router';
import {
  QuestionnaireInstance,
  QuestionnaireStatus,
} from '../../../psa.app.core/models/questionnaireInstance';

@Component({
  selector: 'app-questionnaire-instances-list-for-proband',
  templateUrl: './questionnaire-instances-list-for-proband.component.html',
})
export class QuestionnaireInstancesListForProbandComponent implements OnInit {
  isLoading: boolean = true;
  openQuestionnaireInstances: QuestionnaireInstance[] = [];
  closedQuestionnaireInstances: QuestionnaireInstance[] = [];

  constructor(
    private questionnaireService: QuestionnaireService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.switchTab(0);
  }

  async switchTab(index: number): Promise<void> {
    if (index === 0 && this.openQuestionnaireInstances.length === 0) {
      // open questionnaires
      this.openQuestionnaireInstances =
        await this.loadQuestionnaireInstancesForStatus([
          'active',
          'in_progress',
        ]);
    } else if (index === 1 && this.closedQuestionnaireInstances.length === 0) {
      // closed questionnaires
      this.closedQuestionnaireInstances =
        await this.loadQuestionnaireInstancesForStatus([
          'released_once',
          'released_twice',
        ]);
    }
  }

  async loadQuestionnaireInstancesForStatus(
    status: QuestionnaireStatus[]
  ): Promise<QuestionnaireInstance[]> {
    let instances: QuestionnaireInstance[] = [];
    this.isLoading = true;
    try {
      instances = await this.questionnaireService.getQuestionnaireInstances(
        status
      );
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
    return instances;
  }
}
