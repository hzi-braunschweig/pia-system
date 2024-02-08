/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { EndpointService } from './endpoint.service';

describe('EndpointService', () => {
  let service: EndpointService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(EndpointService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('setEndpointForUser()', () => {
    it('should remove the former endpoint url', () => {
      spyOn(localStorage, 'removeItem');

      service.setEndpointForUser('some-username');

      expect(localStorage.removeItem).toHaveBeenCalledOnceWith(
        'latestEndpoint'
      );
    });

    it('should not set a new endpoint if no backend mapping entry matches', () => {
      const result = service.setEndpointForUser('has-no-mapping');

      expect(result).toBeFalse();
      expect(service.getUrl()).toBeNull();
    });

    it('should set a new endpoint if a backend mapping entry matches', () => {
      const result = service.setEndpointForUser('LOCAL-exists');

      expect(result).toBeTrue();
      expect(service.getUrl()).toEqual('https://pia-app');
    });

    it('should match backend mapping entries case-insensitive', () => {
      const result = service.setEndpointForUser('local-also-exists');

      expect(result).toBeTrue();
      expect(service.getUrl()).toEqual('https://pia-app');
    });
  });

  describe('isEndpointCompatible()', () => {
    it('should return true if mobile app and expected app versions are compatible', (done) => {
      service.setCustomEndpoint('localhost');

      service.isEndpointCompatible('1.27.0').then((result) => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne('localhost/api/v1/');
      req.flush({ minimalAppVersion: '1.26.0' });
    });

    it('should return false if mobile app and expected app versions are compatible', (done) => {
      service.setCustomEndpoint('localhost');

      service.isEndpointCompatible('1.27.0').then((result) => {
        expect(result).toBeFalse();
        done();
      });

      const req = httpMock.expectOne('localhost/api/v1/');
      req.flush({ minimalAppVersion: '1.28.0' });
    });

    it('should return true if endpoint returns error', (done) => {
      service.setCustomEndpoint('localhost');

      service.isEndpointCompatible('1.27.0').then((result) => {
        expect(result).toBeTrue();
        done();
      });

      const req = httpMock.expectOne('localhost/api/v1/');
      req.flush(null, { statusText: 'Not Found', status: 404 });
    });
  });
});
