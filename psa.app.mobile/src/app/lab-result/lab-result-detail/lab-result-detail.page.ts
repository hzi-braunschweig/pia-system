/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { CurrentUser } from '../../auth/current-user.service';

@Component({
  selector: 'app-lab-result-detail',
  templateUrl: './lab-result-detail.page.html',
  styleUrls: ['./lab-result-detail.page.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class LabResultDetailPage implements OnInit {
  labResultId: string =
    this.activatedRoute.snapshot.paramMap.get('labResultId');

  labResultHtml: string;

  isLoading = true;

  constructor(
    private activatedRoute: ActivatedRoute,
    private sampleTrackingClient: SampleTrackingClientService,
    private currentUser: CurrentUser
  ) {}

  public async ngOnInit() {
    await this.getLabResult();
  }

  async getLabResult() {
    this.isLoading = true;

    try {
      this.labResultHtml = await this.sampleTrackingClient.getLabResultForUser(
        this.currentUser.username,
        this.labResultId
      );
    } catch (error) {
      console.error(error);
    }
    this.isLoading = false;
  }
}
