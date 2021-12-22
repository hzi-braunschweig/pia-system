/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { AccountStatusPipe } from './account-status.pipe';
import { createProband } from '../psa.app.core/models/instance.helper.spec';

describe('AccountStatusPipe', () => {
  let pipe: AccountStatusPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccountStatusPipe],
    });
    pipe = TestBed.inject(AccountStatusPipe);
  });

  describe('transform', () => {
    it('should transform user to status', () => {
      expect(
        pipe.transform(
          createProband({ accountStatus: 'account', status: 'active' })
        )
      ).toEqual('PROBANDEN.STATUS_ACTIVE');
      expect(
        pipe.transform(
          createProband({ accountStatus: 'account', status: 'deactivated' })
        )
      ).toEqual('PROBANDEN.STATUS_DEACTIVATED');
      expect(
        pipe.transform(
          createProband({ accountStatus: 'account', status: 'deleted' })
        )
      ).toEqual('UNDEFINED');

      expect(
        pipe.transform(
          createProband({ accountStatus: 'no_account', status: 'active' })
        )
      ).toEqual('PROBANDEN.STATUS_ACTIVE_NO_ACCOUNT');
      expect(
        pipe.transform(
          createProband({ accountStatus: 'no_account', status: 'deactivated' })
        )
      ).toEqual('PROBANDEN.STATUS_COMMUNICATION_BAN');
      expect(
        pipe.transform(
          createProband({ accountStatus: 'no_account', status: 'deleted' })
        )
      ).toEqual('PROBANDEN.STATUS_DELETED');
    });
  });
});
