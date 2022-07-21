/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { PageManager } from './page-manager.service';
import { CurrentUser } from './current-user.service';
import { ComplianceManager } from './compliance-manager.service';
import { MockProvider } from 'ng-mocks';
import { Subject } from 'rxjs';
import { Role } from '../psa.app.core/models/user';
import SpyObj = jasmine.SpyObj;

describe('PageManager', () => {
  let service: PageManager;

  let user: SpyObj<CurrentUser>;
  let complianceManager: SpyObj<ComplianceManager>;
  let complianceChangeSubject: Subject<void>;

  beforeEach(() => {
    user = jasmine.createSpyObj<CurrentUser>('CurrentUser', [
      'hasRole',
      'isProband',
    ]);
    complianceChangeSubject = new Subject<void>();
    complianceManager = jasmine.createSpyObj<ComplianceManager>(
      'ComplianceManager',
      ['userHasCompliances', 'isInternalComplianceActive'],
      {
        complianceDataChangesObservable: complianceChangeSubject.asObservable(),
      }
    );

    TestBed.configureTestingModule({
      providers: [
        PageManager,
        MockProvider(CurrentUser, user),
        MockProvider(ComplianceManager, complianceManager),
      ],
    });
  });

  describe('navPagesObservable', () => {
    it('should emit a list of pages for Forscher role', fakeAsync(() => {
      // Arrange
      setRole('Forscher');
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.ADMINISTRATION',
          path: ['questionnaires/admin'],
          subpaths: [
            'questionnaires/',
            'questionnaire/',
            'questionnaire',
            'edit',
          ],
        },
        {
          name: 'SIDENAV.PROBANDS',
          path: ['probands'],
          subpaths: [
            'probands',
            'questionnaireInstances/',
            'laboratory-results;user_id=',
            'sample-management/',
            'view',
          ],
        },
        { name: 'SIDENAV.STUDIES', path: ['studies'], subpaths: ['studies'] },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/setup'],
          subpaths: ['compliance/'],
        },
        {
          name: 'SIDENAV.STUDY_WELCOME_TEXT',
          path: ['welcome-text'],
          subpaths: ['welcome-text'],
        },
      ]);
    }));

    it('should emit a list of pages for Untersuchungsteam role', fakeAsync(() => {
      // Arrange
      setRole('Untersuchungsteam');
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.PROBANDS',
          path: ['probands'],
          subpaths: [
            'probands',
            'probands/',
            'sample-management/',
            'questionnaires/user?user_id',
            'questionnaire/',
          ],
        },
        {
          name: 'SIDENAV.PLANNED_PROBANDS',
          path: ['planned-probands'],
          subpaths: ['planned-probands/'],
        },
        {
          name: 'SIDENAV.COMPLIANCE_MANAGEMENT',
          path: ['compliance/management'],
          subpaths: ['compliance/'],
        },
      ]);
    }));

    it('should emit a list of pages for SysAdmin role', fakeAsync(() => {
      // Arrange
      setRole('SysAdmin');
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.USER_ADMINISTRATION',
          path: ['internalUsers'],
          subpaths: ['internalUsers'],
        },
        {
          name: 'SIDENAV.STUDIES',
          path: ['studies'],
          subpaths: ['studies', 'studies/Evaluation/users'],
        },
        {
          name: 'SIDENAV.LOGS',
          path: ['deletelogs'],
          subpaths: ['deletelogs'],
        },
      ]);
    }));

    it('should emit a list of pages for ProbandenManager role', fakeAsync(() => {
      // Arrange
      setRole('ProbandenManager');
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.PROBANDS',
          path: ['probands-personal-info'],
          subpaths: [
            'probands-personal-info',
            'probands-personal-info/',
            'questionnaireInstances/',
          ],
        },
        {
          name: 'SIDENAV.SAMPLE_MANAGEMENT',
          path: ['sample-management'],
          subpaths: ['sample-management', 'sample-management/'],
        },
        {
          name: 'SIDENAV.CONTACT_PROBAND',
          path: ['contact-proband'],
          subpaths: ['contact-proband'],
        },
        {
          name: 'SIDENAV.PROBANDS_TO_CONTACT',
          path: ['probands-to-contact'],
          subpaths: ['probands-to-contact', 'probands-to-contact/'],
        },
      ]);
    }));

    it('should emit a list of pages for EinwilligungsManager role', fakeAsync(() => {
      // Arrange
      setRole('EinwilligungsManager');
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/view'],
          subpaths: ['compliance/'],
        },
      ]);
    }));

    it('should emit a list of all pages for Proband role', fakeAsync(() => {
      // Arrange
      setRole('Proband');
      user.isProband.and.returnValue(true);
      complianceManager.userHasCompliances.and.resolveTo(true);
      complianceManager.isInternalComplianceActive.and.resolveTo(true);
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.QUESTIONNAIRES',
          path: ['questionnaires/user'],
          subpaths: ['questionnaires/', 'questionnaire/'],
        },
        {
          name: 'SIDENAV.LABORATORY_RESULTS',
          path: ['laboratory-results'],
          subpaths: ['laboratory-results'],
        },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/agree'],
          subpaths: ['compliance/'],
        },
        {
          name: 'SIDENAV.SETTINGS',
          path: ['settings'],
          subpaths: ['settings'],
        },
        {
          name: 'SIDENAV.CONTACT',
          path: ['contact'],
          subpaths: ['contact'],
        },
      ]);
    }));

    it('should emit a partial list of pages for Proband role', fakeAsync(() => {
      // Arrange
      setRole('Proband');
      user.isProband.and.returnValue(true);
      complianceManager.userHasCompliances.and.resolveTo(false);
      complianceManager.isInternalComplianceActive.and.resolveTo(false);
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.QUESTIONNAIRES',
          path: ['questionnaires/user'],
          subpaths: ['questionnaires/', 'questionnaire/'],
        },
        {
          name: 'SIDENAV.SETTINGS',
          path: ['settings'],
          subpaths: ['settings'],
        },
        {
          name: 'SIDENAV.CONTACT',
          path: ['contact'],
          subpaths: ['contact'],
        },
      ]);
    }));

    it('should emit an empty list if role is not known', fakeAsync(() => {
      // Arrange
      user.hasRole.and.returnValue(false);
      user.isProband.and.returnValue(false);
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);

      // Act
      service.navPages$.subscribe(pagesCallback);
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(1);
      expect(pagesCallback).toHaveBeenCalledWith([]);
    }));

    it('should emit pages for Proband role as a result of compliance changes', fakeAsync(() => {
      // Arrange
      setRole('Proband');
      user.isProband.and.returnValue(true);
      complianceManager.userHasCompliances.and.resolveTo(false);
      complianceManager.isInternalComplianceActive.and.resolveTo(false);
      const pagesCallback = jasmine.createSpy();
      service = TestBed.inject(PageManager);
      service.navPages$.subscribe(pagesCallback);
      tick();
      complianceManager.userHasCompliances.and.resolveTo(true);
      complianceManager.isInternalComplianceActive.and.resolveTo(true);

      // Act
      complianceChangeSubject.next();
      tick();

      // Assert
      expect(pagesCallback).toHaveBeenCalledTimes(2);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.QUESTIONNAIRES',
          path: ['questionnaires/user'],
          subpaths: ['questionnaires/', 'questionnaire/'],
        },
        {
          name: 'SIDENAV.SETTINGS',
          path: ['settings'],
          subpaths: ['settings'],
        },
        {
          name: 'SIDENAV.CONTACT',
          path: ['contact'],
          subpaths: ['contact'],
        },
      ]);
      expect(pagesCallback).toHaveBeenCalledWith([
        { name: 'SIDENAV.HOME', path: ['home'], subpaths: ['home'] },
        {
          name: 'SIDENAV.QUESTIONNAIRES',
          path: ['questionnaires/user'],
          subpaths: ['questionnaires/', 'questionnaire/'],
        },
        {
          name: 'SIDENAV.LABORATORY_RESULTS',
          path: ['laboratory-results'],
          subpaths: ['laboratory-results'],
        },
        {
          name: 'SIDENAV.COMPLIANCE',
          path: ['compliance/agree'],
          subpaths: ['compliance/'],
        },
        {
          name: 'SIDENAV.SETTINGS',
          path: ['settings'],
          subpaths: ['settings'],
        },
        {
          name: 'SIDENAV.CONTACT',
          path: ['contact'],
          subpaths: ['contact'],
        },
      ]);
    }));
  });

  function setRole(role: Role): void {
    user.hasRole.and.callFake((checkRole) => role === checkRole);
  }
});
