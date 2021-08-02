/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component } from '@angular/core';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';

@Component({
  templateUrl: 'probands.component.html',
  styleUrls: ['probands.component.scss'],
})
export class ProbandsComponent {
  constructor(public auth: AuthenticationManager) {}
}
