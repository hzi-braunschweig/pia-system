/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';

/**
 * This only produces an Injectable of JwtHelperService in
 * order to allow mocking in tests
 */
@Injectable({ providedIn: 'root' })
export class JwtService extends JwtHelperService {
  constructor() {
    super();
  }
}
