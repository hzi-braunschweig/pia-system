/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ComplianceService } from './compliance.service';
import { ComplianceClientService } from '../compliance-client/compliance-client.service';
import { ComplianceType } from '../compliance.model';
import { MockBuilder } from 'ng-mocks';
import { AuthService } from '../../auth/auth.service';
import { BehaviorSubject } from 'rxjs';
import { createComplianceDataResponse } from '../compliance.model.spec';
import { User } from '../../auth/auth.model';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('ComplianceService', () => {
  let service: ComplianceService;
  let complianceClient: SpyObj<ComplianceClientService>;
  let auth: SpyObj<AuthService>;
  let currentUser$: BehaviorSubject<User>;

  beforeEach(async () => {
    // Provider and Services
    complianceClient = jasmine.createSpyObj<ComplianceClientService>(
      'ComplianceClientService',
      [
        'getComplianceAgreementForCurrentUser',
        'createComplianceAgreementForCurrentUser',
        'getInternalComplianceActive',
      ]
    );
    currentUser$ = new BehaviorSubject<User>(null);
    auth = jasmine.createSpyObj<AuthService>(
      'AuthService',
      ['getCurrentUser'],
      {
        currentUser$: currentUser$.asObservable(),
      }
    );

    // Build Base Module
    await MockBuilder(ComplianceService)
      .mock(ComplianceClientService, complianceClient)
      .mock(AuthService, auth);
  });

  beforeEach(() => {
    // Create service
    service = TestBed.inject(ComplianceService);
  });

  describe('changing user subscription', () => {
    it('should clear the cache if a user logs out', fakeAsync(() => {
      tick();

      currentUser$.next({
        username: 'TEST-0001',
        role: 'Proband',
        study: 'teststudy',
      });
      tick();
      complianceClient.getComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse()
      );
      service.getComplianceAgreementForCurrentUser();
      tick();
      expect(
        complianceClient.getComplianceAgreementForCurrentUser
      ).toHaveBeenCalled();
      complianceClient.getComplianceAgreementForCurrentUser.calls.reset();
      service.getComplianceAgreementForCurrentUser();
      tick();
      expect(
        complianceClient.getComplianceAgreementForCurrentUser
      ).not.toHaveBeenCalled();
    }));
  });

  describe('userHasCompliances()', () => {
    it('should check, whether the current user has given single compliances', async () => {
      complianceClient.getComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse()
      );
      expect(await service.userHasCompliances([ComplianceType.SAMPLES])).toBe(
        false
      );
      expect(
        await service.userHasCompliances([ComplianceType.BLOODSAMPLES])
      ).toBeTrue();
      expect(
        await service.userHasCompliances([ComplianceType.LABRESULTS])
      ).toBeTrue();
    });

    it('should check, whether the current user has given list of compliances', async () => {
      complianceClient.getComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse()
      );
      expect(
        await service.userHasCompliances([
          ComplianceType.SAMPLES,
          ComplianceType.BLOODSAMPLES,
          ComplianceType.LABRESULTS,
        ])
      ).toBeFalse();
      expect(
        await service.userHasCompliances([
          ComplianceType.BLOODSAMPLES,
          ComplianceType.LABRESULTS,
        ])
      ).toBeTrue();
    });
  });

  describe('userHasAppUsageCompliance()', () => {
    it('should return true if compliance data exists and app usage is true', async () => {
      complianceClient.getComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(true)
      );
      expect(await service.userHasAppUsageCompliance()).toBeTrue();
    });
    it('should return false if compliance data exists and app usage is false', async () => {
      complianceClient.getComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(false)
      );
      expect(await service.userHasAppUsageCompliance()).toBeFalse();
    });

    it('should return false if no compliance text exists', async () => {
      complianceClient.getComplianceAgreementForCurrentUser.and.resolveTo(
        createComplianceDataResponse(null)
      );
      expect(await service.userHasAppUsageCompliance()).toBeFalse();
    });
  });

  describe('isInternalComplianceActive()', () => {
    it('should return true if compliance text exists for the current study', async () => {
      complianceClient.getInternalComplianceActive.and.resolveTo(true);
      expect(await service.isInternalComplianceActive()).toBeTrue();
    });

    it('should return false if no compliance text exists for the current study', async () => {
      complianceClient.getInternalComplianceActive.and.resolveTo(false);
      expect(await service.isInternalComplianceActive()).toBeFalse();
    });
  });

  describe('updateComplianceAgreementForCurrentUser()', () => {
    it('should send a change request to backend', async () => {
      const response = createComplianceDataResponse();
      const request = { ...response, compliance_text: '' };
      complianceClient.createComplianceAgreementForCurrentUser.and.resolveTo(
        response
      );
      const newCompliance =
        await service.updateComplianceAgreementForCurrentUser(request);
      expect(newCompliance).toEqual(response);
    });

    it('should notify all observers that the compliance changed', fakeAsync(() => {
      const spy = createSpy();
      service.complianceDataChangesObservable.subscribe(spy);
      const response = createComplianceDataResponse();
      const request = { ...response, compliance_text: '' };
      service.updateComplianceAgreementForCurrentUser(request);
      tick();
      expect(spy).toHaveBeenCalled();
    }));
  });
});
