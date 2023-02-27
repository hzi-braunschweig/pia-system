/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';

import { CurrentUser } from '../../auth/current-user.service';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { LabResult } from '../lab-result.model';

@Component({
  selector: 'app-lab-result-list',
  templateUrl: './lab-result-list.page.html',
})
export class LabResultListPage implements OnInit {
  labResults: LabResult[] = null;

  constructor(
    private currentUser: CurrentUser,
    private sampleTrackingClient: SampleTrackingClientService
  ) {}

  public async ngOnInit() {
    await this.fetchLabResults();
  }

  isEmpty() {
    return this.labResults && !this.labResults.length;
  }

  private async fetchLabResults() {
    try {
      const labResults = await this.sampleTrackingClient.getUserLabResults(
        this.currentUser.username
      );
      this.labResults = labResults.filter((result) => result.status !== 'new');
    } catch (error) {
      this.labResults = [];
      console.error(error);
    }
  }
}
