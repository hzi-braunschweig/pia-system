/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AlertService } from '../../../_services/alert.service';
import { ActivatedRoute } from '@angular/router';
import { SelectedProbandInfoService } from '../../../_services/selected-proband-info.service';
import { AuthService } from '../../../psa.app.core/providers/auth-service/auth-service';
import { QuestionnaireInstance } from '../../../psa.app.core/models/questionnaireInstance';

@Component({
  selector: 'app-questionnaire-instances-list-for-investigator',
  templateUrl: './questionnaire-instances-list-for-investigator.component.html',
})
export class QuestionnaireInstancesListForInvestigatorComponent
  implements OnInit, OnDestroy
{
  isLoading: boolean = true;
  currentQuestionnaireInstances: QuestionnaireInstance[];
  private pseudonym: string;

  constructor(
    private questionnaireService: QuestionnaireService,
    private activatedRoute: ActivatedRoute,
    private alertService: AlertService,
    private selectedProbandInfoService: SelectedProbandInfoService,
    private userService: AuthService
  ) {}

  async ngOnInit(): Promise<void> {
    this.pseudonym = this.activatedRoute.snapshot.paramMap.get('pseudonym');
    this.isLoading = true;
    try {
      this.currentQuestionnaireInstances =
        await this.questionnaireService.getQuestionnaireInstancesForUser(
          this.pseudonym
        );
      const proband = await this.userService.getProband(this.pseudonym);
      this.selectedProbandInfoService.updateSideNavInfoSelectedProband({
        ids: proband.ids,
        pseudonym: proband.pseudonym,
      });
    } catch (err) {
      this.alertService.errorObject(err);
    }
    this.isLoading = false;
  }

  ngOnDestroy(): void {
    this.selectedProbandInfoService.updateSideNavInfoSelectedProband(null);
  }
}
