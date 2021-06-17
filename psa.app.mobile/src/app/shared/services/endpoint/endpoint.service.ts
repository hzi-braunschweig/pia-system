import { Injectable } from '@angular/core';

import { backendMapping } from '../../../backend-mapping';

interface BackendMappingEntry {
  prefix: string;
  url: string;
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
}
