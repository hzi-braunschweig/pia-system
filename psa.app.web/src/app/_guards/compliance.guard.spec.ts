/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { ComplianceGuard } from './compliance.guard';
import { MockBuilder } from 'ng-mocks';
import { AppModule } from '../app.module';
import { ComplianceService } from '../psa.app.core/providers/compliance-service/compliance-service';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { CurrentUser } from '../_services/current-user.service';
import SpyObj = jasmine.SpyObj;
import createSpyObj = jasmine.createSpyObj;

describe('ComplianceGuard', () => {
  let guard: ComplianceGuard;
  let user: SpyObj<CurrentUser>;
  let complianceService: SpyObj<ComplianceService>;
  let router: SpyObj<Router>;
  let next: SpyObj<ActivatedRouteSnapshot>;
  let state: SpyObj<RouterStateSnapshot>;

  beforeEach(() => MockBuilder(ComplianceGuard, AppModule));

  beforeEach(() => {
    guard = TestBed.inject(ComplianceGuard);
    user = TestBed.inject(CurrentUser) as SpyObj<CurrentUser>;
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
    it('should return true if it is not a proband', async () => {
      user.isProfessional.and.returnValue(true);
      expect(await guard.canActivate(next, state)).toBeTrue();
    });
    it('should navigate to the compliance if compliance is needed', async () => {
      user.isProfessional.and.returnValue(false);
      (user as any).study = 'TestStudy';
      complianceService.isComplianceNeededForProband.and.resolveTo(true);
      expect(await guard.canActivate(next, state)).not.toBeTrue();
      expect(router.createUrlTree).toHaveBeenCalledOnceWith([
        '/compliance/agree',
      ]);
    });
  });
});
