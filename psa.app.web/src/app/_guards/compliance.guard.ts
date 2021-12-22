/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { AuthenticationManager } from '../_services/authentication-manager.service';
import { ComplianceManager } from '../_services/compliance-manager.service';
import { AlertService } from '../_services/alert.service';

@Injectable({
  providedIn: 'root',
})
export class ComplianceGuard implements CanActivate {
  constructor(
    private router: Router,
    private auth: AuthenticationManager,
    private complianceService: ComplianceService,
    private questionnaireService: QuestionnaireService,
    private complianceManager: ComplianceManager,
    private alertService: AlertService
  ) {}

  public async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    if (!this.auth.isAuthenticated()) {
      return false;
    }
    const currentRole = this.auth.getCurrentRole();
    if (currentRole !== 'Proband') {
      return true;
    }
    try {
      const study = this.auth.getCurrentStudy();
      const isComplianceNeeded =
        await this.complianceService.getComplianceNeeded(study);
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
