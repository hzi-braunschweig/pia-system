import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
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
  templateUrl: './license-list.page.html',
  styleUrls: ['./license-list.page.scss'],
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
