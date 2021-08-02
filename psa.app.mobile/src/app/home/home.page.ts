/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { QuestionnaireClientService } from '../questionnaire/questionnaire-client.service';
import { PrimaryStudyService } from '../shared/services/primary-study/primary-study.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomePage implements OnInit {
  welcomeText: string;

  constructor(
    private primaryStudy: PrimaryStudyService,
    private questionnaireClient: QuestionnaireClientService
  ) {}

  async ngOnInit() {
    const study = await this.primaryStudy.getPrimaryStudy();
    const welcomeTextObj = await this.questionnaireClient.getStudyWelcomeText(
      study.name
    );
    if (welcomeTextObj) {
      this.welcomeText = welcomeTextObj.welcome_text;
    }
  }
}
