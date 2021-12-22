/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { ActivatedRoute } from '@angular/router';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { AlertService } from '../../../_services/alert.service';

@Component({
  templateUrl: './laboratory-results.component.html',
})
export class LaboratoryResultsComponent implements OnInit {
  showEmptyResultTable = false;
  showLaboratoryResultTable = false;
  labResultsList: LabResult[];
  isLoading = true;
  user_id = null;
  currentRole: string;

  constructor(
    private sampleTrackingService: SampleTrackingService,
    private translate: TranslateService,
    private questionnaireService: QuestionnaireService,
    private auth: AuthenticationManager,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    const currentUsername: string = this.auth.getCurrentUsername();
    this.currentRole = this.auth.getCurrentRole();
    this.route.params.subscribe(async (params) => {
      this.user_id = params['user_id'] ? params['user_id'] : currentUsername;
      try {
        this.labResultsList =
          await this.sampleTrackingService.getAllLabResultsForUser(
            this.user_id
          );
      } catch (err) {
        this.alertService.errorObject(err);
        this.labResultsList = [];
      }
      this.isLoading = false;
      if (this.labResultsList.length === 0) {
        this.showEmptyResultTable = true;
      } else {
        this.showLaboratoryResultTable = true;
      }
    });
  }
}
