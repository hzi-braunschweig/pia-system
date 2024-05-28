/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';
import SpyObj = jasmine.SpyObj;

import { ComplianceGuard } from './compliance.guard';
import { ComplianceService } from './compliance-service/compliance.service';
import { AuthService } from '../auth/auth.service';
import { MockProvider } from 'ng-mocks';
import { RouterTestingModule } from '@angular/router/testing';

describe('ComplianceGuard', () => {
  let guard: ComplianceGuard;

  let auth: SpyObj<AuthService>;
  let compliance: SpyObj<ComplianceService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    compliance = jasmine.createSpyObj('ComplianceService', [
      'isInternalComplianceNeeded',
      'userHasCompliances',
    ]);

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        MockProvider(AuthService, auth),
        MockProvider(ComplianceService, compliance),
      ],
    });
    guard = TestBed.inject(ComplianceGuard);
  });

  it('should return false if user is not authenticated', async () => {
    auth.isAuthenticated.and.returnValue(false);

    const result = await guard.canActivate(new ActivatedRouteSnapshot(), null);

    expect(result).toBe(false);
  });

  it('should redirect to compliance page if internal compliance is needed', async () => {
    auth.isAuthenticated.and.returnValue(true);
    compliance.isInternalComplianceNeeded.and.resolveTo(true);
    const snapshot = new ActivatedRouteSnapshot();
    snapshot.url = [new UrlSegment('test', {})];

    const result = await guard.canActivate(snapshot, null);

    expect(result).toBeInstanceOf(UrlTree);
    expect(result.toString()).toEqual('/compliance?returnTo=test');
  });

  it('should return true if internal compliance is not needed', async () => {
    auth.isAuthenticated.and.returnValue(true);
    compliance.isInternalComplianceNeeded.and.resolveTo(false);

    const result = await guard.canActivate(new ActivatedRouteSnapshot(), null);

    expect(result).toBeTrue();
  });
});
