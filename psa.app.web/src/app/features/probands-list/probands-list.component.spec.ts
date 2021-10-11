/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  EventEmitter,
  NO_ERRORS_SCHEMA,
  Pipe,
  PipeTransform,
} from '@angular/core';
import {
  ProbandsListComponent,
  ProbandsListEntryActionConfig,
} from './probands-list.component';
import { ProbandsListActionComponent } from './probands-list-action.component';
import { ProbandsListEntryActionComponent } from './probands-list-entry-action.component';
import { AuthService } from 'src/app/psa.app.core/providers/auth-service/auth-service';
import { AlertService } from '../../_services/alert.service';
import { TranslatedUserFactory } from './translated-user/translated-user.factory';
import {
  UserListResponse,
  UserWithStudyAccess,
} from '../../psa.app.core/models/user-with-study-access';
import { TranslatedUser } from './translated-user/translated-user.model';
import { MatTableModule } from '@angular/material/table';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value): any {
    return value;
  }
}

describe('ProbandsListComponent', () => {
  let component: ProbandsListComponent;
  let fixture: ComponentFixture<ProbandsListComponent>;

  let authService: AuthService;
  let alertService: AlertService;
  let translatedUserFactory: TranslatedUserFactory;

  beforeEach(() => {
    authService = jasmine.createSpyObj('AuthService', ['getUsers']);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    translatedUserFactory = jasmine.createSpyObj('TranslatedUserFactory', [
      'create',
    ]);

    (authService.getUsers as jasmine.Spy).and.returnValue(
      Promise.resolve(getUserList())
    );
    (translatedUserFactory.create as jasmine.Spy).and.returnValue(
      getTranslatedUser()
    );

    TestBed.configureTestingModule({
      imports: [MatTableModule],
      declarations: [
        ProbandsListComponent,
        ProbandsListActionComponent,
        ProbandsListEntryActionComponent,
        MockTranslatePipe,
      ],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: AlertService, useValue: alertService },
        { provide: TranslatedUserFactory, useValue: translatedUserFactory },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProbandsListComponent);
    component = fixture.componentInstance;
  });

  describe('ngOnInit()', () => {
    it('should fetch users and extract studies from response', async () => {
      await component.ngOnInit();
      expect(authService.getUsers).toHaveBeenCalledTimes(1);
      expect(component.studyFilterValues.length).toBeGreaterThan(0);
      expect(component.studyFilterValues[0]).toEqual('NAKO Test');
    });

    it('should set table data of data source', async () => {
      await component.ngOnInit();
      expect(component.dataSource.data).toEqual([getTranslatedUser()]);
    });

    it('should show an error alert on errors', async () => {
      (authService.getUsers as jasmine.Spy).and.returnValue(Promise.reject());
      await component.ngOnInit();
      expect(alertService.errorObject).toHaveBeenCalled();
    });

    it('should reset loading state', async () => {
      expect(component.isLoading).toBe(true);
      await component.ngOnInit();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('updateEntryAction()', () => {
    beforeEach(async () => await component.ngOnInit());

    it('should add an entry to the entry actions map', () => {
      component.updateEntryAction(getEntryAction());
      expect(component.entryActions.size).toBe(1);
      expect(component.entryActions.get('test_column')).toEqual(
        getEntryAction()
      );
    });

    it('should add the column name to the displayed columns list', () => {
      component.updateEntryAction(getEntryAction());
      expect(component.displayedColumns).toContain('test_column');
    });
  });

  describe('updateFilter()', () => {
    beforeEach(async () => await component.ngOnInit());

    it('should update the data sources filter', () => {
      expect(component.dataSource.filter).toBe('null__null');
      component.activeFilter.studyName = 'Teststudie';
      component.updateFilter();
      expect(component.dataSource.filter).toBe('Teststudie__null');
    });
  });

  function getUserList(): UserListResponse {
    return {
      users: [getUser()],
      links: { self: { href: '/some/path' } },
    };
  }

  function getUser(): UserWithStudyAccess {
    return {
      username: 'Testproband',
      ids: null,
      study_accesses: [{ study_id: 'NAKO Test', access_level: 'read' }],
      is_test_proband: true,
      first_logged_in_at: '2020-04-20T00:00:00.000Z',
      account_status: 'active',
      study_status: 'active',
      studyNamesArray: [],
      needs_material: false,
      role: 'Proband',
      compliance_bloodsamples: false,
      compliance_labresults: false,
      compliance_samples: false,
      examination_wave: 0,
      study_center: '',
    };
  }

  function getTranslatedUser(): TranslatedUser {
    return {
      username: 'Testproband',
      ids: null,
      study_accesses: 'NAKO (Lesen)',
      is_test_proband: 'Ja',
      first_logged_in_at: '20.04.2020',
      status: 'Aktiv',
      userObject: getUser(),
    };
  }

  function getEntryAction(): ProbandsListEntryActionConfig {
    return {
      columnName: 'test_column',
      header: 'some column title',
      buttons: [
        {
          label: 'Test column',
          icon: 'visibility',
          disableForDeletedAccounts: false,
          showOnlyForIdAndUsernameEquality: false,
          showOnlyForIdAndUsernameInequality: false,
          eventEmitter: new EventEmitter<UserWithStudyAccess>(),
        },
      ],
    };
  }
});
