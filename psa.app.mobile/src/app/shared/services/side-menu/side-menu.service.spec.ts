/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { MockProvider } from 'ng-mocks';
import SpyObj = jasmine.SpyObj;

import { SideMenuService } from './side-menu.service';
import { ComplianceService } from 'src/app/compliance/compliance-service/compliance.service';
import { BehaviorSubject } from 'rxjs';

describe('SideMenuService', () => {
  let service: SideMenuService;
  let complianceService: SpyObj<ComplianceService>;
  let complianceDataChangesSubject: BehaviorSubject<void>;

  beforeEach(() => {
    complianceDataChangesSubject = new BehaviorSubject<void>(undefined);

    complianceService = jasmine.createSpyObj<ComplianceService>(
      'ComplianceService',
      ['userHasCompliances', 'isInternalComplianceActive'],
      {
        complianceDataChangesObservable:
          complianceDataChangesSubject.asObservable(),
      }
    );

    TestBed.configureTestingModule({
      providers: [
        SideMenuService,
        MockProvider(ComplianceService, complianceService),
      ],
    });

    service = TestBed.inject(SideMenuService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty appPages signal', () => {
    expect(service.appPages()).toEqual([]);
  });

  describe('setup()', () => {
    beforeEach(() => {
      complianceService.userHasCompliances.and.resolveTo(true);
      complianceService.isInternalComplianceActive.and.resolveTo(true);
    });

    it('should set up all menu pages when all compliances are active', async () => {
      await service.setup();

      const pages = service.appPages();
      expect(pages.length).toBe(7);

      const pageUrls = pages.map((page) => page.url);
      expect(pageUrls).toContain('/home');
      expect(pageUrls).toContain('/questionnaire');
      expect(pageUrls).toContain('/feedback-statistics');
      expect(pageUrls).toContain('/lab-result');
      expect(pageUrls).toContain('/compliance');
      expect(pageUrls).toContain('/settings');
      expect(pageUrls).toContain('/contact');
    });

    it('should filter out lab results page when user has no lab results compliance', async () => {
      complianceService.userHasCompliances.and.resolveTo(false);

      await service.setup();

      const pages = service.appPages();
      const pageUrls = pages.map((page) => page.url);
      expect(pageUrls).not.toContain('/lab-result');
    });

    it('should filter out compliance page when internal compliance is not active', async () => {
      complianceService.isInternalComplianceActive.and.resolveTo(false);

      await service.setup();

      const pages = service.appPages();
      const pageUrls = pages.map((page) => page.url);
      expect(pageUrls).not.toContain('/compliance');
    });

    it('should include basic pages regardless of compliance status', async () => {
      complianceService.userHasCompliances.and.resolveTo(false);
      complianceService.isInternalComplianceActive.and.resolveTo(false);

      await service.setup();

      const pages = service.appPages();
      const pageUrls = pages.map((page) => page.url);
      expect(pageUrls).toContain('/home');
      expect(pageUrls).toContain('/questionnaire');
      expect(pageUrls).toContain('/feedback-statistics');
      expect(pageUrls).toContain('/settings');
      expect(pageUrls).toContain('/contact');
    });
  });

  describe('compliance data changes subscription', () => {
    it('should call setup when compliance data changes', async () => {
      spyOn(service, 'setup');

      complianceDataChangesSubject.next();

      expect(service.setup).toHaveBeenCalled();
    });
  });
});
