import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import SpyObj = jasmine.SpyObj;

import { ContactClientService } from './contact-client.service';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

describe('ContactClientService', () => {
  let service: ContactClientService;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      providers: [{ provide: EndpointService, useValue: endpoint }],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ContactClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
