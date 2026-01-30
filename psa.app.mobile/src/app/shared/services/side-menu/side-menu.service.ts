/*
 * SPDX-FileCopyrightText: 2025 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable, signal, WritableSignal } from '@angular/core';
import { ComplianceService } from 'src/app/compliance/compliance-service/compliance.service';
import { ComplianceType } from 'src/app/compliance/compliance.model';

interface AppPage {
  title: string;
  url: string;
  icon: string;
  isShown: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SideMenuService {
  public appPages: WritableSignal<AppPage[]> = signal([]);

  constructor(private readonly compliance: ComplianceService) {
    this.compliance.complianceDataChangesObservable.subscribe(() =>
      this.onComplianceChanges()
    );
  }

  public async setup() {
    this.appPages.set(
      [
        {
          title: 'APP.MENU.HOME',
          url: '/home',
          icon: 'home',
          isShown: true,
        },
        {
          title: 'APP.MENU.QUESTIONNAIRES',
          url: '/questionnaire',
          icon: 'list',
          isShown: true,
        },
        {
          title: 'APP.MENU.STATISTICS',
          url: '/feedback-statistics',
          icon: 'bar-chart',
          isShown: true,
        },
        {
          title: 'APP.MENU.LAB_RESULTS',
          url: '/lab-result',
          icon: 'flask',
          isShown: await this.compliance.userHasCompliances([
            ComplianceType.LABRESULTS,
          ]),
        },
        {
          title: 'APP.MENU.COMPLIANCES',
          url: '/compliance',
          icon: 'newspaper',
          isShown: await this.compliance.isInternalComplianceActive(),
        },
        {
          title: 'APP.MENU.SETTINGS',
          url: '/settings',
          icon: 'settings',
          isShown: true,
        },
        {
          title: 'APP.MENU.CONTACT',
          url: '/contact',
          icon: 'person',
          isShown: true,
        },
      ].filter((page) => page.isShown)
    );
  }

  /**
   * Executed as soon as user saves compliance data
   */
  private onComplianceChanges() {
    this.setup();
  }
}
