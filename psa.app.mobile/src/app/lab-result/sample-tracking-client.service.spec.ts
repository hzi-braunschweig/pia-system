import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import SpyObj = jasmine.SpyObj;

import { SampleTrackingClientService } from './sample-tracking-client.service';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

describe('SampleTrackingClientService', () => {
  let service: SampleTrackingClientService;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      providers: [{ provide: EndpointService, useValue: endpoint }],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(SampleTrackingClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
