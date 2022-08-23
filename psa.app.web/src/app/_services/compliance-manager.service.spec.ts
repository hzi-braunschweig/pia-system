/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { MockBuilder } from 'ng-mocks';
import { ComplianceManager } from './compliance-manager.service';
import { ComplianceService } from '../psa.app.core/providers/compliance-service/compliance-service';

import { createComplianceDataResponse } from '../psa.app.core/models/instance.helper.spec';
import { ComplianceType } from '../psa.app.core/models/compliance';
import { CurrentUser } from './current-user.service';
import SpyObj = jasmine.SpyObj;
import createSpy = jasmine.createSpy;

describe('ComplianceManager', () => {
  let service: ComplianceManager;
  let complianceClient: SpyObj<ComplianceService>;
  let user: SpyObj<CurrentUser>;

  beforeEach(async () => {
    // Provider and Services
    complianceClient = jasmine.createSpyObj<ComplianceService>(
      'ComplianceService',
      [
        'getComplianceAgreementForProband',
        'getInternalComplianceActive',
        'createComplianceAgreementForProband',
      ]
    );
    user = jasmine.createSpyObj<CurrentUser>([], {
      username: 'Testuser',
      study: 'Teststudy',
    });

    // Build Base Module
    await MockBuilder(ComplianceManager)
      .mock(ComplianceService, complianceClient)
      .mock(CurrentUser, user);
  });

  beforeEach(fakeAsync(() => {
    // Create service
    service = TestBed.inject(ComplianceManager);
  }));

  describe('userHasCompliances()', () => {
    it('should check, whether the current user has given single compliances', async () => {
      complianceClient.getComplianceAgreementForProband.and.resolveTo(
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
      complianceClient.getComplianceAgreementForProband.and.resolveTo(
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
      complianceClient.createComplianceAgreementForProband.and.resolveTo(
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
