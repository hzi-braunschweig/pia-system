/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';

import { AlertService } from './alert.service';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('AlertService', () => {
  let service: AlertService;

  let router: SpyObj<Router>;
  let routerEvents: Subject<RouterEvent>;
  let translate: SpyObj<TranslateService>;

  beforeEach(async () => {
    // Provider and Services
    routerEvents = new Subject<RouterEvent>();
    router = jasmine.createSpyObj('Router', [], {
      events: routerEvents.asObservable(),
    });
    translate = jasmine.createSpyObj(['instant']);

    // Build Base Module
    TestBed.configureTestingModule({
      providers: [
        AlertService,
        MockProvider(Router, router),
        MockProvider(TranslateService, translate),
      ],
    });
    service = TestBed.inject(AlertService);
  });

  it('should reset the alert subject on navigation start', fakeAsync(() => {
    // Arrange
    const messageSpy = createSpy('messageSpy');
    service.getMessage().subscribe(messageSpy);

    // Act
    routerEvents.next(new NavigationStart(1, 'someurl'));
    tick();

    // Assert
    expect(messageSpy).toHaveBeenCalledOnceWith(null);
  }));
});
