import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NotificationClientService } from './notification-client.service';

describe('NotificationClientService', () => {
  let service: NotificationClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(NotificationClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
