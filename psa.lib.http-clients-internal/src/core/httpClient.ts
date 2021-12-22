/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import * as fetch from 'node-fetch';
import Boom from '@hapi/boom';
import { StatusCodes } from 'http-status-codes';

export type ResponseType = 'json' | 'text';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  responseType?: ResponseType;
  returnNullWhenNotFound?: boolean;
  headers?: Record<string, string>;
}

export class HttpClient {
  /**
   * Fetch implementation to use for all requests. May only
   * be used if the convenience methods of HttpClient do not
   * fit the specific use case.
   *
   * Can also be used to mock fetch within tests.
   */
  public static readonly fetch = fetch.default;

  private static readonly defaultRequestOptions: Required<RequestOptions> = {
    responseType: 'json',
    returnNullWhenNotFound: false,
    headers: {},
  };

  public constructor(private readonly serviceUrl: string) {}

  public async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    return this.fetch<T>('GET', url, options);
  }

  public async post<T>(
    url: string,
    body: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.fetch<T>('POST', url, options, body);
  }

  public async put<T>(
    url: string,
    body: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.fetch<T>('PUT', url, options, body);
  }

  public async patch<T>(
    url: string,
    body: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    return this.fetch<T>('PATCH', url, options, body);
  }

  public async delete(url: string): Promise<void> {
    return this.fetch('DELETE', url, {});
  }

  private async fetch<T>(
    method: 'GET',
    url: string,
    options: RequestOptions
  ): Promise<T>;
  private async fetch<T>(
    method: 'POST' | 'PUT' | 'PATCH',
    url: string,
    options: RequestOptions,
    body: unknown
  ): Promise<T>;
  private async fetch(
    method: 'DELETE',
    url: string,
    options: RequestOptions
  ): Promise<void>;
  private async fetch<T = null>(
    method: HttpMethod,
    url: string,
    additionalOptions: RequestOptions,
    body?: unknown
  ): Promise<T | string | null | void> {
    const options: Required<RequestOptions> = {
      ...HttpClient.defaultRequestOptions,
      ...additionalOptions,
    };
    let res;
    try {
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        res = await HttpClient.fetch(`${this.serviceUrl}${url}`, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
          body: JSON.stringify(body),
        });
      } else {
        res = await HttpClient.fetch(`${this.serviceUrl}${url}`, {
          method: method,
          headers: options.headers,
        });
      }
    } catch (e) {
      throw Boom.serverUnavailable(
        `${method} ${url} did not receive a response`,
        e
      );
    }
    if (!res.ok) {
      if (
        options.returnNullWhenNotFound &&
        res.status === StatusCodes.NOT_FOUND
      ) {
        return null;
      }
      throw Boom.internal(
        `${method} ${url} received an Error`,
        await res.text(),
        res.status
      );
    }
    if (method === 'DELETE' || res.status === StatusCodes.NO_CONTENT) {
      return;
    }
    if (options.responseType === 'text') {
      return res.text();
    }
    return res.json() as Promise<T>;
  }
}
