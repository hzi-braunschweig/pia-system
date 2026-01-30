/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';

import { CurrentUser } from '../../auth/current-user.service';
import { SampleTrackingClientService } from '../sample-tracking-client.service';
import { LabResult } from '../lab-result.model';
import { addIcons } from 'ionicons';
import { flask, eye } from 'ionicons/icons';
import { HeaderComponent } from '../../shared/components/header/header.component';
import {
  IonContent,
  IonList,
  IonItemGroup,
  IonItem,
  IonIcon,
  IonLabel,
  IonNote,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { NgIf, NgFor, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-lab-result-list',
  templateUrl: './lab-result-list.page.html',
  imports: [
    HeaderComponent,
    IonContent,
    NgIf,
    IonList,
    IonItemGroup,
    NgFor,
    IonItem,
    RouterLink,
    IonIcon,
    IonLabel,
    IonNote,
    IonSkeletonText,
    DatePipe,
    TranslateModule,
  ],
})
export class LabResultListPage implements OnInit {
  labResults: LabResult[] = null;

  constructor(
    private currentUser: CurrentUser,
    private sampleTrackingClient: SampleTrackingClientService
  ) {
    addIcons({ flask, eye });
  }

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
