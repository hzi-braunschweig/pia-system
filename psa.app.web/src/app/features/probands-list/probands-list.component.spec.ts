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
import { TranslatedUser } from './translated-user/translated-user.model';
import { MatTableModule } from '@angular/material/table';
import { Proband } from '../../psa.app.core/models/proband';
import { createProband } from '../../psa.app.core/models/instance.helper.spec';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value): any {
    return value;
  }
}

describe('ProbandsListComponent', () => {
  let component: ProbandsListComponent;
  let fixture: ComponentFixture<ProbandsListComponent>;

  let authService: jasmine.SpyObj<AuthService>;
  let alertService: jasmine.SpyObj<AlertService>;
  let translatedUserFactory: jasmine.SpyObj<TranslatedUserFactory>;

  beforeEach(() => {
    authService = jasmine.createSpyObj(AuthService, ['getProbands']);
    alertService = jasmine.createSpyObj(AlertService, ['errorObject']);
    translatedUserFactory = jasmine.createSpyObj(TranslatedUserFactory, [
      'create',
    ]);

    authService.getProbands.and.resolveTo([createProband()]);
    translatedUserFactory.create.and.returnValue(getTranslatedUser());

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
      expect(authService.getProbands).toHaveBeenCalledTimes(1);
      expect(component.studyFilterValues.length).toBeGreaterThan(0);
      expect(component.studyFilterValues[0]).toEqual('NAKO Test');
    });

    it('should set table data of data source', async () => {
      await component.ngOnInit();
      expect(component.dataSource.data).toEqual([getTranslatedUser()]);
    });

    it('should show an error alert on errors', async () => {
      (authService.getProbands as jasmine.Spy).and.returnValue(
        Promise.reject()
      );
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

  function getTranslatedUser(): TranslatedUser {
    return {
      username: 'Testproband',
      ids: null,
      study: 'NAKO',
      is_test_proband: 'Ja',
      first_logged_in_at: new Date('2020-04-20'),
      status: 'Aktiv',
      userObject: createProband(),
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
          disableForDeletedProbands: false,
          showOnlyForIdsAndPseudonymEquality: false,
          showOnlyForIdsAndPseudonymInequality: false,
          eventEmitter: new EventEmitter<Proband>(),
        },
      ],
    };
  }
});
