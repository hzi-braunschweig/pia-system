/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SampleTrackingService } from '../../../psa.app.core/providers/sample-tracking-service/sample-tracking.service';
import { CurrentUser } from '../../../_services/current-user.service';
import { AlertService } from '../../../_services/alert.service';

@Component({
  selector: 'app-laboratory-result-details',
  templateUrl: './laboratory-result-details.component.html',
  styleUrls: ['./laboratory-result-details.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LaboratoryResultDetailsComponent implements OnInit {
  public isLoading = true;
  public labResultHtml: string;

  private userId: string =
    this.activatedRoute.snapshot.queryParamMap.get('user_id');

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly sampleTrackingService: SampleTrackingService,
    private readonly router: Router,
    private readonly user: CurrentUser,
    private readonly alertService: AlertService
  ) {}

  public async ngOnInit(): Promise<void> {
    try {
      this.labResultHtml =
        await this.sampleTrackingService.getLabResultObservationForUser(
          this.userId ?? this.user.username,
          this.activatedRoute.snapshot.paramMap.get('id')
        );
    } catch (e) {
      this.alertService.errorObject(e);
    }
    this.isLoading = false;
  }

  public onBackButtonClicked(): void {
    if (this.userId) {
      this.router.navigate(['/laboratory-results/', { user_id: this.userId }]);
    } else {
      this.router.navigate(['/laboratory-results']);
    }
  }
}
