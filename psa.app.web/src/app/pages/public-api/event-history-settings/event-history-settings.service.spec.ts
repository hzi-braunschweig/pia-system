/*
 * SPDX-FileCopyrightText: 2024 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { EventHistorySettingsService } from './event-history-settings.service';
import { MockBuilder, ngMocks } from 'ng-mocks';
import { HttpClientModule } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { EventHistorySettingsDto } from './event-history-settings.dto';

describe('EventHistorySettingsService', () => {
  beforeEach(() =>
    MockBuilder(EventHistorySettingsService).replace(
      HttpClientModule,
      HttpClientTestingModule
    )
  );

  it('get() should return config', () => {
    // Arrange
    const service = ngMocks.findInstance(EventHistorySettingsService);
    const httpMock = ngMocks.findInstance(HttpTestingController);
    const spy = jasmine.createSpy();
    const expected: EventHistorySettingsDto = {
      retentionTimeInDays: 0,
      active: false,
    };

    // Act
    service.get().subscribe(spy);

    // Assert
    const req = httpMock.expectOne(`api/v1/event-history/config`);
    expect(req.request.method).toBe('GET');
    req.flush(expected);

    expect(spy).toHaveBeenCalledWith(expected);
    httpMock.verify();
  });

  it('post() should send and return the expected config', () => {
    // Arrange
    const service = ngMocks.findInstance(EventHistorySettingsService);
    const httpMock = ngMocks.findInstance(HttpTestingController);
    const spy = jasmine.createSpy();
    const expected: EventHistorySettingsDto = {
      retentionTimeInDays: 0,
      active: false,
    };

    // Act
    service.post(expected).subscribe(spy);

    // Assert
    const req = httpMock.expectOne(`api/v1/event-history/config`);
    expect(req.request.method).toBe('POST');
    req.flush(expected);

    expect(spy).toHaveBeenCalledWith(expected);
    httpMock.verify();
  });
});
