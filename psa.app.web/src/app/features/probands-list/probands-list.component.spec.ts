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
  ProbandsListEntryActionButtonConfig,
  ProbandsListEntryActionConfig,
} from './probands-list.component';
import { ProbandsListActionComponent } from './probands-list-action.component';
import { ProbandsListEntryActionComponent } from './probands-list-entry-action.component';
import { AlertService } from '../../_services/alert.service';
import { TranslatedUserFactory } from './translated-user/translated-user.factory';
import { TranslatedUser } from './translated-user/translated-user.model';
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table';
import { Proband } from '../../psa.app.core/models/proband';
import { createProband } from '../../psa.app.core/models/instance.helper.spec';
import { ProbandService } from '../../psa.app.core/providers/proband-service/proband.service';
import { TranslatePipe } from '@ngx-translate/core';
import { MockPipe } from 'ng-mocks';
import { CurrentUser } from '../../_services/current-user.service';

@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value): any {
    return value;
  }
}

describe('ProbandsListComponent', () => {
  let component: ProbandsListComponent;
  let fixture: ComponentFixture<ProbandsListComponent>;

  let probandService: jasmine.SpyObj<ProbandService>;
  let alertService: jasmine.SpyObj<AlertService>;
  let translatedUserFactory: jasmine.SpyObj<TranslatedUserFactory>;
  let currentUser: jasmine.SpyObj<CurrentUser>;

  beforeEach(() => {
    probandService = jasmine.createSpyObj('ProbandService', ['getProbands']);
    alertService = jasmine.createSpyObj('AlertService', ['errorObject']);
    translatedUserFactory = jasmine.createSpyObj('TranslatedUserFactory', [
      'create',
    ]);
    currentUser = jasmine.createSpyObj('CurrentUser', [], {
      studies: ['NAKO Test'],
    });

    probandService.getProbands.and.resolveTo([createProband()]);
    translatedUserFactory.create.and.returnValue(getTranslatedUser());

    TestBed.configureTestingModule({
      imports: [MatTableModule],
      declarations: [
        ProbandsListComponent,
        ProbandsListActionComponent,
        ProbandsListEntryActionComponent,
        MockPipe(TranslatePipe),
      ],
      providers: [
        { provide: ProbandService, useValue: probandService },
        { provide: AlertService, useValue: alertService },
        { provide: TranslatedUserFactory, useValue: translatedUserFactory },
        { provide: CurrentUser, useValue: currentUser },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ProbandsListComponent);
    component = fixture.componentInstance;
  });

  describe('fetchProbands()', () => {
    beforeEach(() => (component.activeFilter.studyName = 'NAKO Test'));

    it('should fetch probands based on selected study', async () => {
      await component.fetchProbands();
      expect(probandService.getProbands).toHaveBeenCalledOnceWith('NAKO Test');
    });

    it('should set table data of data source', async () => {
      await component.fetchProbands();
      expect(component.dataSource.data).toEqual([getTranslatedUser()]);
    });

    it('should show an error alert on errors', async () => {
      (probandService.getProbands as jasmine.Spy).and.returnValue(
        Promise.reject()
      );
      await component.fetchProbands();
      expect(alertService.errorObject).toHaveBeenCalled();
    });
  });

  describe('updateEntryAction()', () => {
    beforeEach(() => component.ngOnInit());

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
    beforeEach(() => component.ngOnInit());

    it('should update the data sources filter', () => {
      expect(component.dataSource.filter).toBe('null__null');
      component.activeFilter.studyName = 'Teststudie';
      component.updateFilter();
      expect(component.dataSource.filter).toBe('Teststudie__null');
    });
  });

  describe('isShown()', () => {
    it('should return true if button is configured to always show', () => {
      const result = component.isShown(createProband(), {
        showOnlyForIdsAndPseudonymEquality: true,
        showOnlyForIdsAndPseudonymInequality: true,
      } as ProbandsListEntryActionButtonConfig);
      expect(result).toBeTrue();
    });

    it('should return true if button is configured to show for ids and pseudonym equality', () => {
      const result = component.isShown(
        createProband({ pseudonym: 'test-0001', ids: 'TEST-0001' }),
        {
          showOnlyForIdsAndPseudonymEquality: true,
          showOnlyForIdsAndPseudonymInequality: false,
        } as ProbandsListEntryActionButtonConfig
      );
      expect(result).toBeTrue();
    });

    it('should return true if button is configured to show for ids and pseudonym inequality', () => {
      const result = component.isShown(
        createProband({ pseudonym: 'test-9999', ids: 'TEST-0001' }),
        {
          showOnlyForIdsAndPseudonymEquality: false,
          showOnlyForIdsAndPseudonymInequality: true,
        } as ProbandsListEntryActionButtonConfig
      );
      expect(result).toBeTrue();
    });

    it('should return false if button is configured to show for ids and pseudonym equality', () => {
      const result = component.isShown(
        createProband({ pseudonym: 'test-9999', ids: 'TEST-0001' }),
        {
          showOnlyForIdsAndPseudonymEquality: true,
          showOnlyForIdsAndPseudonymInequality: false,
        } as ProbandsListEntryActionButtonConfig
      );
      expect(result).toBeFalse();
    });

    it('should return false if button is configured to show for ids and pseudonym inequality', () => {
      const result = component.isShown(
        createProband({ pseudonym: 'test-0001', ids: 'TEST-0001' }),
        {
          showOnlyForIdsAndPseudonymEquality: false,
          showOnlyForIdsAndPseudonymInequality: true,
        } as ProbandsListEntryActionButtonConfig
      );
      expect(result).toBeFalse();
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
      origin: 'PROBAND.ORIGIN.INVESTIGATOR',
      created_at: null,
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
