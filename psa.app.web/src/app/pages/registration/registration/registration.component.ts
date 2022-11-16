/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  template: '',
})
export class RegistrationComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private route: ActivatedRoute,
    private keycloakService: KeycloakService
  ) {}

  ngOnInit(): void {
    const study = this.route.snapshot.paramMap.get('study');
    const url = new URL(
      this.keycloakService.getKeycloakInstance().createRegisterUrl({
        redirectUri: environment.baseUrl,
      })
    );

    url.searchParams.set('study', study);

    this.redirect(url.toString());
  }

  private redirect(url: string): void {
    this.document.location.href = url;
  }
}
