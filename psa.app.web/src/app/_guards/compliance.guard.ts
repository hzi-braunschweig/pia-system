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

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    const currentRole = this.auth.currentRole;
    if (currentRole !== 'Proband') {
      return true;
    }
    if (!this.auth.isAuthenticated()) {
      return false;
    }
    try {
      const study = await this.questionnaireService.getPrimaryStudy();
      const isComplianceNeeded =
        await this.complianceService.getComplianceNeeded(study.name);
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
