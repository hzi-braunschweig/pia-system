/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeycloakClientService } from '../auth/keycloak-client.service';
import { RedirectService } from '../shared/services/redirect/redirect.service';

@Component({
  template: '',
  standalone: true,
  imports: [],
})
export class RegistrationComponent implements OnInit {
  constructor(
    private readonly redirectService: RedirectService,
    private readonly keycloakService: KeycloakClientService,
    private readonly route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    const study = this.route.snapshot.paramMap.get('study');

    if (!study) {
      throw new Error('No study parameter provided in the URL');
    }
    const url = this.keycloakService.createRegisterUrl(study);

    this.redirectService.redirectTo(url.toString());
  }
}
