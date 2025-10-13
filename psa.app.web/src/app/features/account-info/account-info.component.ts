/*
 * SPDX-FileCopyrightText: 2022 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Component, inject, Input, OnInit } from '@angular/core';
import { Role } from '../../psa.app.core/models/user';
import Keycloak from 'keycloak-js';

@Component({
  selector: 'app-account-info',
  templateUrl: './account-info.component.html',
  styleUrls: ['./account-info.component.scss'],
  standalone: false,
})
export class AccountInfoComponent implements OnInit {
  @Input() public username: string;

  @Input() public role: Role;

  private static readonly roleTranslationKeys: Record<Role, string> = {
    Proband: 'ROLES.PROBAND',
    Forscher: 'ROLES.RESEARCHER',
    Untersuchungsteam: 'ROLES.RESEARCH_TEAM',
    ProbandenManager: 'ROLES.PROBANDS_MANAGER',
    EinwilligungsManager: 'ROLES.COMPLIANCE_MANAGER',
    SysAdmin: 'ROLES.SYSTEM_ADMINISTRATOR',
  };
  private readonly keycloak = inject(Keycloak);

  public roleTranslationKey: string;

  constructor() {}

  public ngOnInit(): void {
    this.roleTranslationKey =
      AccountInfoComponent.roleTranslationKeys[this.role];
  }

  public manageAccount() {
    this.keycloak.accountManagement();
  }
}
