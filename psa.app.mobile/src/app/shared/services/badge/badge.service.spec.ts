/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BadgeService } from './badge.service';
import { MockBuilder, MockRender } from 'ng-mocks';
import { Badge } from '@capawesome/capacitor-badge';
import { fakeAsync, tick } from '@angular/core/testing';
import { Platform } from '@ionic/angular';

describe('BadgeService', () => {
  let service: BadgeService;
  let platform: jasmine.SpyObj<Platform>;

  beforeEach(async () => {
    const platformSpy = jasmine.createSpyObj('Platform', ['ready', 'is']);
    platformSpy.ready.and.returnValue(Promise.resolve('ready'));
    platformSpy.is.and.returnValue(true); // Default to hybrid platform

    spyOn(Badge, 'set');
    spyOn(Badge, 'clear');

    await MockBuilder(BadgeService).mock(Platform, platformSpy);
    service = MockRender(BadgeService).point.componentInstance;
    platform = service['platform'] as jasmine.SpyObj<Platform>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('set', () => {
    it('should set badge to the given number', fakeAsync(() => {
      platform.is.and.returnValue(true);

      service.set(10);
      tick();

      expect(platform.ready).toHaveBeenCalled();
      expect(Badge.set).toHaveBeenCalledWith({ count: 10 });
    }));

    it('should not set badge on browser', fakeAsync(() => {
      platform.is.and.returnValue(false);

      service.set(10);
      tick();

      expect(Badge.set).not.toHaveBeenCalled();
    }));
  });

  describe('clear', () => {
    it('should clear the badge', fakeAsync(() => {
      platform.is.and.returnValue(true);

      service.clear();
      tick();

      expect(platform.ready).toHaveBeenCalled();
      expect(platform.is).toHaveBeenCalledWith('hybrid');
      expect(Badge.clear).toHaveBeenCalled();
    }));

    it('should not clear the badge on browser', fakeAsync(() => {
      platform.is.and.returnValue(false);

      service.clear();
      tick();

      expect(platform.is).toHaveBeenCalledWith('hybrid');
      expect(Badge.clear).not.toHaveBeenCalled();
    }));
  });
});
