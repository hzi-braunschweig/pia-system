/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { StudyStatusPipe } from './study-status.pipe';

describe('StudyStatusPipe', () => {
  let pipe: StudyStatusPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StudyStatusPipe],
    });
    pipe = TestBed.inject(StudyStatusPipe);
  });

  describe('transform', () => {
    it('should transform user to status', () => {
      expect(pipe.transform('active')).toEqual('STUDIES.STATUS_ACTIVE');
      expect(pipe.transform('deletion_pending')).toEqual(
        'STUDIES.STATUS_DELETION_PENDING'
      );
      expect(pipe.transform('deleted')).toEqual('STUDIES.STATUS_DELETED');
      expect(pipe.transform(undefined)).toEqual('UNDEFINED');
    });
  });
});
