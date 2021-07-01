import * as fetch from 'node-fetch';
import * as Boom from '@hapi/boom';
import {
  VPersonContactDetailOverview,
  VPersonOverview,
} from '../models/modysApi';
import { ModysConnectionConfig } from '../models/modys';

export class ModysClient {
  public constructor(
    private readonly connectionConfig: ModysConnectionConfig
  ) {}

  public async getProbandIdentifierbyId(
    identifier: string,
    identifierTypeId: number
  ): Promise<string> {
    return this.genericFetch(
      `/pidByIdandType/${identifier}/${identifierTypeId}`,
      'text'
    );
  }

  public async getProbandWithId(probandId: string): Promise<VPersonOverview> {
    return this.genericFetch<VPersonOverview>(`/probands/${probandId}`);
  }

  public async getProbandContactDetails(
    probandId: string
  ): Promise<VPersonContactDetailOverview[]> {
    return this.genericFetch<VPersonContactDetailOverview[]>(
      `/probandContactDetails/${probandId}`
    );
  }

  private async genericFetch(
    path: string,
    contentType: 'text'
  ): Promise<string>;
  private async genericFetch<T>(path: string): Promise<T>;
  private async genericFetch<T = string>(
    path: string,
    contentType: 'json' | 'text' = 'json'
  ): Promise<T | string> {
    let res;
    try {
      res = await fetch.default(
        this.connectionConfig.baseUrl +
          (this.connectionConfig.baseUrl.endsWith('/') ? 'api' : '/api') +
          path,
        {
          method: 'get',
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.getAuthorizationHeader(),
          },
        }
      );
    } catch (error) {
      throw Boom.serverUnavailable(
        'ModysClient fetch: Did not receive a response',
        error
      );
    }
    if (!res.ok) {
      throw Boom.internal(
        'ModysClient fetch: received an Error',
        await res.text(),
        res.status
      );
    }
    if (contentType === 'text') {
      return res.text();
    } else {
      return res.json() as Promise<T>;
    }
  }

  private getAuthorizationHeader(): string {
    return (
      'Basic ' +
      Buffer.from(
        this.connectionConfig.username + ':' + this.connectionConfig.password
      ).toString('base64')
    );
  }
}
