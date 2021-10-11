/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { AccountStatusPipe } from './account-status.pipe';
import {
  AccountStatus,
  StudyStatus,
  UserWithStudyAccess,
} from '../psa.app.core/models/user-with-study-access';

describe('AccountStatusPipe', () => {
  let pipe: AccountStatusPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccountStatusPipe],
    });
    pipe = TestBed.get(AccountStatusPipe);
  });

  describe('transform', () => {
    it('should transform user to status', () => {
      expect(pipe.transform(getUser())).toEqual('STUDIES.STATUS_ACTIV');

      expect(pipe.transform(getUser('active', 'deletion_pending'))).toEqual(
        'STUDIES.STATUS_DELETION_PENDING'
      );

      expect(pipe.transform(getUser('active', 'deleted'))).toEqual(
        'STUDIES.STATUS_DELETED'
      );

      expect(pipe.transform(getUser('deactivation_pending'))).toEqual(
        'PROBANDEN.STATUS_DEACTIVATION_PENDING'
      );

      expect(pipe.transform(getUser('deactivated'))).toEqual(
        'PROBANDEN.STATUS_DEACTIVATED'
      );

      expect(pipe.transform(getUser('no_account'))).toEqual(
        'PROBANDEN.STATUS_NO_ACCOUNT'
      );
    });
  });

  function getUser(
    account_status: AccountStatus = 'active',
    study_status: StudyStatus = 'active'
  ): UserWithStudyAccess {
    return {
      account_status,
      study_status,
      first_logged_in_at: '2020-04-20T00:00:00.000Z',
      ids: null,
      is_test_proband: false,
      studyNamesArray: [],
      needs_material: false,
      role: 'Proband',
      study_accesses: [{ study_id: 'NAKO Test', access_level: 'read' }],
      username: 'Testproband',
      compliance_bloodsamples: false,
      compliance_labresults: false,
      compliance_samples: false,
      examination_wave: 0,
      study_center: '',
    };
  }
});
