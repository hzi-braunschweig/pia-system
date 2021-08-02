/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-lab-result-detail',
  templateUrl: './lab-result-detail.page.html',
  styleUrls: ['./lab-result-detail.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LabResultDetailPage {
  labResultId: string =
    this.activatedRoute.snapshot.paramMap.get('labResultId');

  labResultHtml: string;

  isLoading = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private sampleTrackingClient: SampleTrackingClientService,
    private auth: AuthService
  ) {
    this.getLabResult();
  }

  async getLabResult() {
    this.isLoading = true;

    try {
      this.labResultHtml = await this.sampleTrackingClient.getLabResultForUser(
        this.auth.getCurrentUser().username,
        this.labResultId
      );
    } catch (error) {
      console.error(error);
    }
    this.isLoading = false;
  }
}
