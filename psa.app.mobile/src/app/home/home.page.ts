/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { QuestionnaireClientService } from '../questionnaire/questionnaire-client.service';
import { CurrentUser } from '../auth/current-user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class HomePage implements OnInit {
  welcomeText: string;

  constructor(
    private questionnaireClient: QuestionnaireClientService,
    private currentUser: CurrentUser
  ) {}

  async ngOnInit() {
    const welcomeTextObj = await this.questionnaireClient.getStudyWelcomeText(
      this.currentUser.study
    );
    if (welcomeTextObj) {
      this.welcomeText = welcomeTextObj.welcome_text;
    }
  }
}
