/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BadgeService } from './badge.service';
import { MockBuilder, MockInstance, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { FirebaseX } from '@awesome-cordova-plugins/firebase-x/ngx';

describe('BadgeService', () => {
  let service: BadgeService;
  let spySetBadgeNumber;

  beforeEach(async () => {
    await MockBuilder(BadgeService, AppModule);
    spySetBadgeNumber = MockInstance(
      FirebaseX,
      'setBadgeNumber',
      jasmine.createSpy()
    );
    service = MockRender(BadgeService).point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should set badge to the given number', () => {
    service.set(10);
    expect(spySetBadgeNumber).toHaveBeenCalledOnceWith(10);
  });
  it('should set badge to 0', () => {
    service.clear();
    expect(spySetBadgeNumber).toHaveBeenCalledOnceWith(0);
  });
});
