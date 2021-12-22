/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { QuestionnaireClientService } from '../questionnaire/questionnaire-client.service';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HomePage implements OnInit {
  welcomeText: string;

  constructor(
    private questionnaireClient: QuestionnaireClientService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    const study = this.auth.getCurrentUser().study;
    const welcomeTextObj = await this.questionnaireClient.getStudyWelcomeText(
      study
    );
    if (welcomeTextObj) {
      this.welcomeText = welcomeTextObj.welcome_text;
    }
  }
}
