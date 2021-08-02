/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';

import { ComplianceService } from './compliance.service';
import { ComplianceClientService } from '../compliance-client/compliance-client.service';
import { PrimaryStudyService } from '../../shared/services/primary-study/primary-study.service';
import { ComplianceDataResponse, ComplianceType } from '../compliance.model';
import { SegmentType } from '../segment.model';

describe('ComplianceService', () => {
  let service: ComplianceService;
  let complianceClient: ComplianceClientService;
  let primaryStudyService: PrimaryStudyService;

  const testStudyName = 'Teststudie';

  beforeEach(() => {
    complianceClient = jasmine.createSpyObj('ComplianceService', [
      'getComplianceAgreementForCurrentUser',
      'createComplianceAgreementForCurrentUser',
      'getInternalComplianceActive',
    ]);
    primaryStudyService = jasmine.createSpyObj('QuestionnaireService', [
      'getPrimaryStudy',
    ]);

    (
      complianceClient.getComplianceAgreementForCurrentUser as jasmine.Spy
    ).and.returnValue(null);
    (
      complianceClient.createComplianceAgreementForCurrentUser as jasmine.Spy
    ).and.returnValue(createComplianceData());
    (primaryStudyService.getPrimaryStudy as jasmine.Spy).and.returnValue({
      name: testStudyName,
    });

    TestBed.configureTestingModule({
      providers: [
        ComplianceService,
        { provide: ComplianceClientService, useValue: complianceClient },
        { provide: PrimaryStudyService, useValue: primaryStudyService },
      ],
    });
    service = TestBed.inject(ComplianceService);
  });

  describe('userHasCompliances()', () => {
    it('should check, whether the current user has given single compliances', async () => {
      (
        complianceClient.getComplianceAgreementForCurrentUser as jasmine.Spy
      ).and.returnValue(createComplianceData());
      const store = {
        currentUser:
          '{"compliance_samples": false, "compliance_bloodsamples": true, "compliance_labresults": true}',
      };
      spyOn(localStorage, 'getItem').and.callFake((key) => {
        return store[key];
      });
      expect(await service.userHasCompliances([ComplianceType.SAMPLES])).toBe(
        false
      );
      expect(
        await service.userHasCompliances([ComplianceType.BLOODSAMPLES])
      ).toBe(true);
      expect(
        await service.userHasCompliances([ComplianceType.LABRESULTS])
      ).toBe(true);
    });

    it('should check, whether the current user has given list of compliances', async () => {
      (
        complianceClient.getComplianceAgreementForCurrentUser as jasmine.Spy
      ).and.returnValue(createComplianceData());
      const store = {
        currentUser:
          '{"compliance_samples": false, "compliance_bloodsamples": true, "compliance_labresults": true}',
      };
      spyOn(localStorage, 'getItem').and.callFake((key) => {
        return store[key];
      });
      expect(
        await service.userHasCompliances([
          ComplianceType.SAMPLES,
          ComplianceType.BLOODSAMPLES,
          ComplianceType.LABRESULTS,
        ])
      ).toBe(false);
      expect(
        await service.userHasCompliances([
          ComplianceType.BLOODSAMPLES,
          ComplianceType.LABRESULTS,
        ])
      ).toBe(true);
    });
  });

  describe('userHasAppUsageCompliance()', () => {
    it('should return true if compliance data exists and app usage is true', async () => {
      (
        complianceClient.getComplianceAgreementForCurrentUser as jasmine.Spy
      ).and.returnValue(createComplianceData());
      expect(await service.userHasAppUsageCompliance()).toBe(true);
    });
    it('should return false if compliance data exists and app usage is false', async () => {
      (
        complianceClient.getComplianceAgreementForCurrentUser as jasmine.Spy
      ).and.returnValue(createComplianceData(false));
      expect(await service.userHasAppUsageCompliance()).toBe(false);
    });

    it('should return false if no compliance text exists', async () => {
      (
        complianceClient.getComplianceAgreementForCurrentUser as jasmine.Spy
      ).and.returnValue(createComplianceData(null));
      expect(await service.userHasAppUsageCompliance()).toBe(false);
    });
  });

  describe('isInternalComplianceActive()', () => {
    it('should return true if compliance text exists for the current study', async () => {
      (
        complianceClient.getInternalComplianceActive as jasmine.Spy
      ).and.returnValue(true);
      expect(await service.isInternalComplianceActive()).toBe(true);
    });

    it('should return false if no compliance text exists for the current study', async () => {
      (
        complianceClient.getInternalComplianceActive as jasmine.Spy
      ).and.returnValue(false);
      expect(await service.isInternalComplianceActive()).toBe(false);
    });
  });

  function createComplianceData(
    appCompliance: boolean = true
  ): ComplianceDataResponse {
    return {
      compliance_text_object: [{ type: SegmentType.HTML, html: '' }],
      timestamp: new Date(),
      textfields: {
        firstname: 'heiko',
        lastname: 'schotte',
        birthdate: new Date('1968-03-12'),
        location: 'Muster-Stadt',
      },
      compliance_system: {
        app: appCompliance,
        samples: false,
        bloodsamples: true,
        labresults: true,
      },
      compliance_questionnaire: [{ name: 'world-domination', value: true }],
    };
  }
});
