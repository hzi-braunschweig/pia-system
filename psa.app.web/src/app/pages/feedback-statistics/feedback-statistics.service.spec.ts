/*
 * SPDX-FileCopyrightText: 2023 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { FeedbackStatisticsService } from './feedback-statistics.service';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { FeedbackStatisticConfigurationDto } from './feedback-statistic-configuration/feedback-statistic-configuration.model';
import { FeedbackStatisticDto } from '@pia-system/charts';

describe('FeedbackStatisticsService', () => {
  let service: FeedbackStatisticsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FeedbackStatisticsService],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(FeedbackStatisticsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getFeedbackStatisticConfiguration()', () => {
    it('should do a request to get a configuration', (done) => {
      service
        .getFeedbackStatisticConfiguration(1234, 'Teststudy')
        .subscribe((result) => {
          expect(result).toEqual({
            id: 1234,
          } as FeedbackStatisticConfigurationDto);
          done();
        });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'api/v1/feedbackstatistic/studies/Teststudy/configuration/1234',
      });
      req.flush({ id: 1234 });
    });
  });

  describe('getFeedbackStatisticsForProband()', () => {
    it('should do a request to get a configuration', (done) => {
      service.getFeedbackStatisticsForProband().subscribe((result) => {
        expect(result).toEqual([
          {
            configurationId: 1234,
          } as FeedbackStatisticDto,
        ]);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'api/v1/feedbackstatistic/',
      });
      req.flush([
        {
          configurationId: 1234,
        },
      ]);
    });
  });

  describe('hasFeedbackStatisticsForProband()', () => {
    it('should return true if at least one result was returned', (done) => {
      service.hasFeedbackStatisticsForProband().then((result) => {
        expect(result).toEqual(true);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'api/v1/feedbackstatistic/',
      });
      req.flush([{ configurationId: 1 }]);
    });

    it('should return false if no result was returned', (done) => {
      service.hasFeedbackStatisticsForProband().then((result) => {
        expect(result).toEqual(false);
        done();
      });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'api/v1/feedbackstatistic/',
      });
      req.flush([]);
    });
  });

  describe('getFeedbackStatisticsForResearcher()', () => {
    it('should do a request to get a configuration', (done) => {
      service
        .getFeedbackStatisticsForResearcher('Teststudy')
        .subscribe((result) => {
          expect(result).toEqual([
            {
              configurationId: 1234,
            } as FeedbackStatisticDto,
          ]);
          done();
        });

      const req = httpMock.expectOne({
        method: 'GET',
        url: 'api/v1/feedbackstatistic/studies/Teststudy',
      });
      req.flush([
        {
          configurationId: 1234,
        },
      ]);
    });
  });

  describe('postFeedbackStatisticConfiguration()', () => {
    it('should do a request to post a configuration', (done) => {
      const configuration = {
        id: 1234,
        study: 'Teststudy',
      } as FeedbackStatisticConfigurationDto;

      service
        .postFeedbackStatisticConfiguration(configuration)
        .subscribe((result) => {
          expect(result).toEqual(configuration);
          done();
        });

      const req = httpMock.expectOne({
        method: 'POST',
        url: 'api/v1/feedbackstatistic/studies/Teststudy/configuration',
      });
      req.flush(configuration);
    });
  });

  describe('putFeedbackStatisticConfiguration()', () => {
    it('should do a request to put a configuration', (done) => {
      const configuration = {
        id: 1234,
        study: 'Teststudy',
      } as FeedbackStatisticConfigurationDto;

      service
        .putFeedbackStatisticConfiguration(configuration)
        .subscribe((result) => {
          expect(result).toEqual(configuration);
          done();
        });

      const req = httpMock.expectOne({
        method: 'PUT',
        url: 'api/v1/feedbackstatistic/studies/Teststudy/configuration/1234',
      });
      req.flush(configuration);
    });
  });

  describe('deleteFeedbackStatisticConfiguration()', () => {
    it('should do a request to delete a configuration', (done) => {
      service
        .deleteFeedbackStatisticConfiguration(1234, 'Teststudy')
        .subscribe((result) => {
          done();
        });

      const req = httpMock.expectOne({
        method: 'DELETE',
        url: 'api/v1/feedbackstatistic/studies/Teststudy/configuration/1234',
      });
      req.flush({});
    });
  });
});
