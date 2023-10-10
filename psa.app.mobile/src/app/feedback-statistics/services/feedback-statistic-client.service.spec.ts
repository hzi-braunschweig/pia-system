/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { FeedbackStatisticClientService } from './feedback-statistic-client.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FeedbackStatisticDto } from '@pia-system/charts';
import SpyObj = jasmine.SpyObj;
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { MockProvider } from 'ng-mocks';

describe('FeedbackStatisticClientService', () => {
  let service: FeedbackStatisticClientService;
  let httpMock: HttpTestingController;

  let endpoint: SpyObj<EndpointService>;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MockProvider(EndpointService, endpoint)],
    });
    service = TestBed.inject(FeedbackStatisticClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getFeedbackStatistics()', () => {
    it('should do a request to get a configuration', (done) => {
      service.getFeedbackStatistics().subscribe((result) => {
        expect(result).toEqual([
          {
            configurationId: 1234,
          } as FeedbackStatisticDto,
        ]);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'http://localhost/api/v1/feedbackstatistic/',
      });
      req.flush([
        {
          configurationId: 1234,
        },
      ]);
    });
  });

  describe('hasFeedbackStatistics()', () => {
    it('should return true if at least one result was returned', (done) => {
      service.hasFeedbackStatistics().then((result) => {
        expect(result).toEqual(true);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'http://localhost/api/v1/feedbackstatistic/',
      });
      req.flush([{ configurationId: 1 }]);
    });

    it('should return false if no result was returned', (done) => {
      service.hasFeedbackStatistics().then((result) => {
        expect(result).toEqual(false);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'http://localhost/api/v1/feedbackstatistic/',
      });
      req.flush([]);
    });
  });
});
