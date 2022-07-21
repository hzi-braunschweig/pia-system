/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { LabResult } from '../../../psa.app.core/models/labresult';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../_services/alert.service';
import { CurrentUser } from '../../../_services/current-user.service';

@Component({
  templateUrl: './laboratory-results.component.html',
})
export class LaboratoryResultsComponent implements OnInit {
  public showEmptyResultTable = false;
  public showLaboratoryResultTable = false;
  public labResultsList: LabResult[];
  public isLoading = true;
  public user_id = null;

  constructor(
    public readonly user: CurrentUser,
    private readonly sampleTrackingService: SampleTrackingService,
    private readonly route: ActivatedRoute,
    private readonly alertService: AlertService
  ) {}

  public async ngOnInit(): Promise<void> {
    this.route.params.subscribe(async (params) => {
      this.user_id = params['user_id'] ?? this.user.username;
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
