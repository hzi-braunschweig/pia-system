/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import SpyObj = jasmine.SpyObj;

import { ConnectionStatus, NetworkService } from './network.service';
import { Network } from '@capacitor/network';

describe('NetworkService', () => {
  let service: NetworkService;
  let networkSpy: jasmine.Spy;

  beforeEach(() => {
    spyOn(Network, 'getStatus').and.callThrough();
    networkSpy = spyOn(Network, 'addListener');
    networkSpy.and.callThrough();

    TestBed.configureTestingModule({
      providers: [],
    });
    service = TestBed.inject(NetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should init the connection status', fakeAsync(() => {
    service.initialize();
    tick();
    expect(service.isOnline()).toBeTrue();
    expect(service.getStatus()).toBe(ConnectionStatus.Online);
    expect(service.getNetworkType()).toBe('wifi');
  }));

  it('should update the connection status', fakeAsync(() => {
    networkSpy.and.callFake((_action, listenerFn) => {
      const handle = setTimeout(
        () => listenerFn({ connected: false, connectionType: 'none' }),
        10
      );
      return Promise.resolve(handle as any);
    });
    service.initialize();
    tick(20);
    expect(service.isOffline()).toBeTrue();
    expect(service.isOnline()).toBeFalse();
    expect(service.getStatus()).toBe(ConnectionStatus.Offline);
    expect(service.getNetworkType()).toBe('none');
  }));
});
