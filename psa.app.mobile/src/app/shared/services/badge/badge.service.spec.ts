/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { BadgeService } from './badge.service';
import { MockBuilder, MockRender } from 'ng-mocks';
import { AppModule } from '../../../app.module';
import { Badge } from '@capawesome/capacitor-badge';
import { fakeAsync, tick } from '@angular/core/testing';

describe('BadgeService', () => {
  let service: BadgeService;

  beforeEach(async () => {
    spyOn(Badge, 'set');
    spyOn(Badge, 'clear');
    await MockBuilder(BadgeService, AppModule);
    service = MockRender(BadgeService).point.componentInstance;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  it('should set badge to the given number', fakeAsync(() => {
    service.set(10);
    tick();
    expect(Badge.set).toHaveBeenCalledWith({ count: 10 });
  }));
  it('should set badge to 0', fakeAsync(() => {
    service.clear();
    tick();
    expect(Badge.clear).toHaveBeenCalled();
  }));
});
