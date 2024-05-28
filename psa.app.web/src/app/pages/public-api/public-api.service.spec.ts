/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PublicApiService } from './public-api.service';
import { ApiClientDto, CreateApiClientRequestDto } from './api-client.model';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { HttpClientModule } from '@angular/common/http';

describe('PublicApiService', () => {
  beforeEach(() =>
    MockBuilder(PublicApiService).replace(
      HttpClientModule,
      HttpClientTestingModule
    )
  );

  it('getApiClients() should return expected clients', () => {
    // Arrange
    const service = ngMocks.findInstance(PublicApiService);
    const httpMock = ngMocks.findInstance(HttpTestingController);
    const mockClients: ApiClientDto[] = [createApiClient()];
    const spy = jasmine.createSpy('success');

    // Act
    service.getApiClients().subscribe(spy);

    // Assert
    const req = httpMock.expectOne('api/v1/publicapi/clients');
    expect(req.request.method).toBe('GET');
    req.flush(mockClients);

    expect(spy).toHaveBeenCalledWith(mockClients);
    httpMock.verify();
  });

  it('createApiClient() should post and return the new client', () => {
    // Arrange
    const service = ngMocks.findInstance(PublicApiService);
    const httpMock = ngMocks.findInstance(HttpTestingController);
    const newClient: CreateApiClientRequestDto = {
      name: 'client-name',
      studies: ['study-1', 'study-2'],
    };
    const createdClient: ApiClientDto = createApiClient();
    const spy = jasmine.createSpy('success');

    // Act
    service.createApiClient(newClient).subscribe(spy);

    // Assert
    const req = httpMock.expectOne('api/v1/publicapi/clients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newClient);
    req.flush(createdClient);

    expect(spy).toHaveBeenCalledWith(createdClient);
    httpMock.verify();
  });

  it('deleteApiClient() should delete and return the deleted client', () => {
    // Arrange
    const service = ngMocks.findInstance(PublicApiService);
    const httpMock = ngMocks.findInstance(HttpTestingController);
    const clientId = 'test-id';
    const spy = jasmine.createSpy('success');

    // Act
    service.deleteApiClient(clientId).subscribe(spy);

    // Assert
    const req = httpMock.expectOne(`api/v1/publicapi/clients/${clientId}`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(spy).toHaveBeenCalled();
    httpMock.verify();
  });

  function createApiClient(
    overwrite: Partial<ApiClientDto> = {}
  ): ApiClientDto {
    return {
      clientId: 'client-id',
      name: 'client-name',
      studies: ['study-1', 'study-2'],
      secret: 'client-secret',
      createdAt: new Date().toISOString(),
      ...overwrite,
    };
  }
});
