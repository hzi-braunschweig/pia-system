/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import SpyObj = jasmine.SpyObj;

import { MaterialClientService } from './material-client.service';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

describe('MaterialClientService', () => {
  let service: MaterialClientService;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        { provide: EndpointService, useValue: endpoint },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(MaterialClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
