/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';

import { backendMapping } from '../../../backend-mapping';
import { compare } from 'compare-versions';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

interface BackendMappingEntry {
  prefix: string;
  url: string;
}

interface EndpointMetaData {
  /**
   * Minimal Version needed to access the endpoints API
   */
  minimalAppVersion: string;
}

@Injectable({
  providedIn: 'root',
})
export class EndpointService {
  private static readonly LOCAL_STORAGE_KEY = 'customBackendUrl';

  private endpointUrl: string | null = this.getCustomEndpoint();

  private static validateUrl(url: string): string | null {
    if (url && url.endsWith('/')) {
      url = url.substr(0, url.length - 1);
    }
    return url || null;
  }

  constructor(private http: HttpClient) {}

  getUrl(): string | null {
    return this.endpointUrl;
  }

  setEndpointForUser(username: string): boolean {
    this.removeCustomEndpoint();

    const mapping: BackendMappingEntry = backendMapping.find(
      (entry) => entry.prefix && username && username.startsWith(entry.prefix)
    );
    if (!mapping) {
      return false;
    }
    this.endpointUrl = mapping.url;
    return true;
  }

  getCustomEndpoint(): string {
    return localStorage.getItem(EndpointService.LOCAL_STORAGE_KEY);
  }

  setCustomEndpoint(endpointUrl: string): boolean {
    const url = EndpointService.validateUrl(endpointUrl);
    if (!url) {
      return false;
    }
    this.endpointUrl = url;
    localStorage.setItem(EndpointService.LOCAL_STORAGE_KEY, this.endpointUrl);
    return true;
  }

  removeCustomEndpoint(): void {
    this.endpointUrl = null;
    localStorage.removeItem(EndpointService.LOCAL_STORAGE_KEY);
  }

  isCustomEndpoint(): boolean {
    return !!this.getCustomEndpoint();
  }

  /**
   * Endpoint is only compatible if its minimal app version is
   * lower or equal to the current app version.
   */
  async isEndpointCompatible(currentAppVersion: string): Promise<boolean> {
    try {
      const minimalAppVersion = await this.getMinimalAppVersion();
      return compare(minimalAppVersion, currentAppVersion, '<=');
    } catch (e) {
      /**
       * just return true for endpoints which are unavailable or
       * which do not implement the meta data api
       */
      return true;
    }
  }

  private async getMinimalAppVersion(): Promise<string> {
    return await this.http
      .get<EndpointMetaData>(`${this.endpointUrl}/api/v1/`)
      .pipe(map((endpointMetaData) => endpointMetaData.minimalAppVersion))
      .toPromise();
  }
}
