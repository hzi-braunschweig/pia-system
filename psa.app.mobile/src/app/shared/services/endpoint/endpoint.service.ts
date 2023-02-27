/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { compare } from 'compare-versions';

import { backendMapping } from '../../../backend-mapping';

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

interface Endpoint {
  url: string;
  isCustom: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EndpointService {
  private static readonly LOCAL_STORAGE_KEY = 'latestEndpoint';

  private _endpointUrl: string | null = null;
  private _isCustomEndpoint: boolean = false;

  private static validateUrl(url: string): string | null {
    if (url && url.endsWith('/')) {
      url = url.substr(0, url.length - 1);
    }
    return url || null;
  }

  constructor(private readonly http: HttpClient) {
    const endpoint = this.getLatestEndpoint();
    this._endpointUrl = endpoint?.url;
    this._isCustomEndpoint = endpoint?.isCustom;
    console.log('EndpointService: endpoint set', endpoint);
  }

  public getUrl(): string | null {
    return this._endpointUrl;
  }

  public isCustomEndpoint(): boolean {
    return this._isCustomEndpoint;
  }

  public getCustomEndpointUrl(): string | null {
    return this._isCustomEndpoint ? this._endpointUrl : null;
  }

  public setEndpointForUser(username: string): boolean {
    this.removeLatestEndpoint();

    const mapping: BackendMappingEntry = backendMapping.find(
      (entry) =>
        entry.prefix &&
        username &&
        username.toLowerCase().startsWith(entry.prefix.toLowerCase())
    );
    if (!mapping) {
      return false;
    }
    this.setEndpoint(mapping.url, false);
    return true;
  }

  public setCustomEndpoint(endpointUrl: string): boolean {
    this.removeLatestEndpoint();

    const url = EndpointService.validateUrl(endpointUrl);
    if (!url) {
      return false;
    }
    this.setEndpoint(url, true);
    return true;
  }

  public removeLatestEndpoint(): void {
    this._endpointUrl = null;
    this._isCustomEndpoint = false;
    localStorage.removeItem(EndpointService.LOCAL_STORAGE_KEY);
  }

  /**
   * Endpoint is only compatible if its minimal app version is
   * lower or equal to the current app version.
   */
  public async isEndpointCompatible(
    currentAppVersion: string
  ): Promise<boolean> {
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

  private getLatestEndpoint(): Endpoint {
    return JSON.parse(localStorage.getItem(EndpointService.LOCAL_STORAGE_KEY));
  }

  private setEndpoint(url: string, isCustom: boolean): void {
    this._endpointUrl = url;
    this._isCustomEndpoint = isCustom;

    const endpoint: Endpoint = { url, isCustom };
    localStorage.setItem(
      EndpointService.LOCAL_STORAGE_KEY,
      JSON.stringify(endpoint)
    );
  }

  private async getMinimalAppVersion(): Promise<string> {
    return await this.http
      .get<EndpointMetaData>(`${this._endpointUrl}/api/v1/`)
      .pipe(map((endpointMetaData) => endpointMetaData.minimalAppVersion))
      .toPromise();
  }
}
