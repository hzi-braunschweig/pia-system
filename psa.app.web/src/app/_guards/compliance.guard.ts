/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { ComplianceManager } from '../_services/compliance-manager.service';
import { AlertService } from '../_services/alert.service';
import { CurrentUser } from '../_services/current-user.service';

@Injectable({
  providedIn: 'root',
})
export class ComplianceGuard {
  constructor(
    private readonly router: Router,
    private readonly user: CurrentUser,
    private readonly complianceService: ComplianceService,
    private readonly complianceManager: ComplianceManager,
    private readonly alertService: AlertService
  ) {}

  public async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    if (this.user.isProfessional()) {
      return true;
    }
    try {
      const isComplianceNeeded =
        await this.complianceService.isComplianceNeededForProband(
          this.user.study,
          this.user.username
        );
      if (isComplianceNeeded) {
        this.alertService.errorMessage('COMPLIANCE.COMPLIANCE_NEEDED');
        return this.router.createUrlTree(['/compliance/agree']);
      }
      return this.complianceManager.userHasCompliances(
        next.data.expectedCompliances
      );
    } catch (err) {
      this.alertService.errorObject(err);
      return false;
    }
  }
}
