/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { TestBed } from '@angular/core/testing';
import { Platform } from '@ionic/angular';

import { BackButtonService } from './back-button.service';
import { NEVER } from 'rxjs';

describe('BackButtonService', () => {
  let service: BackButtonService;

  let platform;

  beforeEach(() => {
    platform = {
      backButton: {
        subscribeWithPriority: jasmine
          .createSpy('backButton')
          .and.returnValue(NEVER.subscribe()),
      },
    };

    TestBed.configureTestingModule({
      providers: [{ provide: Platform, useValue: platform }],
    });
    service = TestBed.inject(BackButtonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
