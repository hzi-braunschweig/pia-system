import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import SpyObj = jasmine.SpyObj;

import { ComplianceGuard } from './compliance.guard';
import { ComplianceService } from './compliance-service/compliance.service';

describe('ComplianceGuard', () => {
  let guard: ComplianceGuard;

  let compliance: SpyObj<ComplianceService>;
  let router: SpyObj<Router>;

  beforeEach(() => {
    compliance = jasmine.createSpyObj('ComplianceService', [
      'isInternalComplianceActive',
      'userHasAppUsageCompliance',
      'userHasCompliances',
    ]);
    router = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: ComplianceService, useValue: compliance },
        { provide: Router, useValue: router },
      ],
    });
    guard = TestBed.inject(ComplianceGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
