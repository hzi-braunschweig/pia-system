import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SettingsClientService } from './settings-client.service';

describe('SettingsClientService', () => {
  let service: SettingsClientService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(SettingsClientService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
