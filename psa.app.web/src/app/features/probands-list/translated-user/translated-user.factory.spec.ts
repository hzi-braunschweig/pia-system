/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { TranslatedUserFactory } from './translated-user.factory';
import { AccountStatusPipe } from '../../../pipes/account-status.pipe';
import { TranslatedUser } from './translated-user.model';
import { createProband } from '../../../psa.app.core/models/instance.helper.spec';
import { ProbandOrigin } from '../../../psa.app.core/models/proband';

describe('TranslatedUserFactory', () => {
  let service: TranslatedUserFactory;
  let translate: jasmine.SpyObj<TranslateService>;
  let accountStatusPipe: jasmine.SpyObj<AccountStatusPipe>;
  let datePipe: jasmine.SpyObj<DatePipe>;

  beforeEach(() => {
    translate = jasmine.createSpyObj('TranslateService', ['instant']);
    accountStatusPipe = jasmine.createSpyObj(AccountStatusPipe, ['transform']);
    datePipe = jasmine.createSpyObj('DatePipe', ['transform']);

    TestBed.configureTestingModule({
      providers: [
        TranslatedUserFactory,
        { provide: TranslateService, useValue: translate },
        { provide: AccountStatusPipe, useValue: accountStatusPipe },
        { provide: DatePipe, useValue: datePipe },
      ],
    });
    service = TestBed.get(TranslatedUserFactory);
  });

  describe('create()', () => {
    it('should create a TranslatedUser from a UserWithStudyAccess', () => {
      translate.instant.and.callFake((value) => value);
      accountStatusPipe.transform.and.returnValue('PROBANDEN.STATUS_ACTIVE');
      datePipe.transform.and.returnValue('20.04.2020');

      const selected = createProband({
        pseudonym: 'Testproband',
        ids: null,
        study: 'NAKO Test',
        isTestProband: false,
        firstLoggedInAt: new Date('2020-04-20'),
        origin: ProbandOrigin.INVESTIGATOR,
        createdAt: new Date('2022-10-18'),
      });
      const expected: TranslatedUser = {
        username: 'Testproband',
        ids: null,
        study: 'NAKO Test',
        is_test_proband: 'GENERAL.NO',
        first_logged_in_at: new Date('2020-04-20'),
        status: 'PROBANDEN.STATUS_ACTIVE',
        userObject: selected,
        origin: 'PROBAND.ORIGIN.INVESTIGATOR',
        created_at: new Date('2022-10-18'),
      };

      expect(service.create(selected)).toEqual(expected);
    });
  });
});
