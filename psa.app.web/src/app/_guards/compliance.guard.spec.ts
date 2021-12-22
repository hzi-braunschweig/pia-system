/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { ComplianceGuard } from './compliance.guard';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../app.module';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import { ComplianceService } from '../psa.app.core/providers/compliance-service/compliance-service';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('ComplianceGuard', () => {
  let guard: ComplianceGuard;
  let auth: SpyObj<AuthenticationManager>;
  let complianceService: SpyObj<ComplianceService>;
  let router: SpyObj<Router>;
  let next: SpyObj<ActivatedRouteSnapshot>;
  let state: SpyObj<RouterStateSnapshot>;

  beforeEach(() => MockBuilder(ComplianceGuard, AppModule));

  beforeEach(() => {
    guard = TestBed.inject(ComplianceGuard);
    auth = TestBed.inject(
      AuthenticationManager
    ) as SpyObj<AuthenticationManager>;
    complianceService = TestBed.inject(
      ComplianceService
    ) as SpyObj<ComplianceService>;
    router = TestBed.inject(Router) as SpyObj<Router>;
    next = createSpyObj<ActivatedRouteSnapshot>('next', undefined, {
      data: null,
    });
    state = createSpyObj<RouterStateSnapshot>('next', undefined, {
      url: '/home',
    });
  });

  describe('canActivate()', () => {
    it('should return false if no user is logged in', async () => {
      auth.isAuthenticated.and.returnValue(false);
      expect(await guard.canActivate(next, state)).toBeFalse();
    });
    it('should return true if it is not a proband', async () => {
      auth.isAuthenticated.and.returnValue(true);
      auth.getCurrentRole.and.returnValue('Forscher');
      expect(await guard.canActivate(next, state)).toBeTrue();
    });
    it('should navigate to the compliance if compliance is needed', async () => {
      auth.isAuthenticated.and.returnValue(true);
      auth.getCurrentRole.and.returnValue('Proband');
      auth.getCurrentStudy.and.returnValue('TestStudy');
      complianceService.getComplianceNeeded.and.resolveTo(true);
      expect(await guard.canActivate(next, state)).not.toBeTrue();
      expect(router.createUrlTree).toHaveBeenCalledOnceWith([
        '/compliance/agree',
      ]);
    });
  });
});
