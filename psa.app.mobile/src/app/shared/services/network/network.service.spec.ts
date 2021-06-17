import { TestBed } from '@angular/core/testing';
import { Network } from '@ionic-native/network/ngx';
import { NEVER } from 'rxjs';
import SpyObj = jasmine.SpyObj;

import { NetworkService } from './network.service';

describe('NetworkService', () => {
  let service: NetworkService;

  let network: SpyObj<Network>;

  beforeEach(() => {
    network = jasmine.createSpyObj('Network', ['onConnect', 'onDisconnect']);
    network.onConnect.and.returnValue(NEVER);
    network.onDisconnect.and.returnValue(NEVER);

    TestBed.configureTestingModule({
      providers: [{ provide: Network, useValue: network }],
    });
    service = TestBed.inject(NetworkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
