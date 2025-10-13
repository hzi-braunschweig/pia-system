/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, inject, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import Keycloak from 'keycloak-js';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  template: '',
  standalone: false,
})
export class RegistrationComponent implements OnInit {
  private readonly keycloak = inject(Keycloak);

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const study = this.route.snapshot.paramMap.get('study');
    const url = new URL(
      this.keycloak.createRegisterUrl({
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
