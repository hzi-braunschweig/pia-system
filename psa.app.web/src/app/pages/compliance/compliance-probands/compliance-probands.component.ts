/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';

@Component({
  selector: 'app-compliance-probands',
  templateUrl: './compliance-probands.component.html',
})
export class ComplianceProbandsComponent implements OnInit {
  isLoading = true;
  username: string;
  study: string;

  constructor(
    private auth: AuthenticationManager,
    private questionnaireService: QuestionnaireService
  ) {}

  async ngOnInit(): Promise<void> {
    this.username = this.auth.currentUser.username;
    this.study = await this.questionnaireService
      .getPrimaryStudy()
      .then((study) => study.name);
    this.isLoading = false;
  }
}
