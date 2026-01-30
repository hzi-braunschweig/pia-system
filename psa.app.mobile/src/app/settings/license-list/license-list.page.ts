/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, shareReplay } from 'rxjs/operators';
import { HeaderComponent } from '../../shared/components/header/header.component';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSkeletonText,
} from '@ionic/angular/standalone';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import {
  CdkVirtualScrollViewport,
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
} from '@angular/cdk/scrolling';
import { TranslateModule } from '@ngx-translate/core';

export interface LicenseJson {
  licenses: LicenseEntry[];
}

export interface LicenseEntry {
  packageName: string;
  license: string;
  licenseText: string;
}

@Component({
  selector: 'app-license-list',
  templateUrl: './license-list.page.html',
  styleUrls: ['./license-list.page.scss'],
  imports: [
    HeaderComponent,
    IonContent,
    NgIf,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    NgFor,
    IonSkeletonText,
    AsyncPipe,
    TranslateModule,
  ],
})
export class LicenseListPage {
  readonly licenses: Observable<LicenseEntry[]> = this.fetchLicenses();

  constructor(private readonly http: HttpClient) {}

  private fetchLicenses(): Observable<LicenseEntry[]> {
    return this.http.get<LicenseJson>('../../../assets/licenses.json').pipe(
      map((licenseJson) => licenseJson.licenses),
      shareReplay(1) // cache result to reduce http requests
    );
  }
}
