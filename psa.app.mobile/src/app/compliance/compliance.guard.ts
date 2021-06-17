import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { ComplianceService } from './compliance-service/compliance.service';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ComplianceGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private compliance: ComplianceService,
    private router: Router
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean | UrlTree> {
    if (!this.auth.isAuthenticated()) {
      return false;
    }
    const isComplianceNeeded =
      await this.compliance.isInternalComplianceNeeded();

    if (isComplianceNeeded) {
      return this.router.createUrlTree(['compliance'], {
        queryParams: { returnTo: next.url.map((segment) => segment.path) },
      });
    }
    if (next.data && 'requiresCompliance' in next.data) {
      return await this.compliance.userHasCompliances(
        next.data.requiresCompliance
      );
    }
    return true;
  }
}
