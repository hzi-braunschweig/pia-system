import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import SpyObj = jasmine.SpyObj;

import { MaterialClientService } from './material-client.service';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

describe('MaterialClientService', () => {
  let service: MaterialClientService;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      providers: [{ provide: EndpointService, useValue: endpoint }],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(MaterialClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
