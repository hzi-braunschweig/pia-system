import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import SpyObj = jasmine.SpyObj;

import { QuestionnaireClientService } from './questionnaire-client.service';
import { EndpointService } from '../shared/services/endpoint/endpoint.service';

describe('QuestionnaireClientService', () => {
  let service: QuestionnaireClientService;
  let endpoint: SpyObj<EndpointService>;

  beforeEach(() => {
    endpoint = jasmine.createSpyObj('EndpointService', ['getUrl']);
    endpoint.getUrl.and.returnValue('http://localhost');

    TestBed.configureTestingModule({
      providers: [{ provide: EndpointService, useValue: endpoint }],
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(QuestionnaireClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
