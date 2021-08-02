/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

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
  templateUrl: './license-list.component.html',
  styleUrls: ['./license-list.component.scss'],
})
export class LicenseListComponent {
  readonly licenses: Observable<LicenseEntry[]> = this.fetchLicenses();

  constructor(private readonly http: HttpClient) {}

  private fetchLicenses(): Observable<LicenseEntry[]> {
    return this.http.get<LicenseJson>('../../../assets/licenses.json').pipe(
      map((licenseJson) => licenseJson.licenses),
      shareReplay(1) // cache result to reduce http requests
    );
  }
}
