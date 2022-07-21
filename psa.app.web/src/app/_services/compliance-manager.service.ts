/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceType,
} from '../psa.app.core/models/compliance';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { Subject } from 'rxjs';
import { CurrentUser } from './current-user.service';

@Injectable({
  providedIn: 'root',
})
/**
 * This service is a conclusion of the new and the old compliance. If there is a new type of compliance
 * (In-App-Compliance) the old one will be ignored.
 */
export class ComplianceManager {
  private complianceDataCache: ComplianceDataResponse;
  private complianceDataChangesSubject = new Subject<void>();
  public readonly complianceDataChangesObservable =
    this.complianceDataChangesSubject.asObservable();
  private cachedIsInternalComplianceActive: boolean = undefined;

  public constructor(
    private user: CurrentUser,
    private complianceService: ComplianceService
  ) {}

  public async isInternalComplianceActive(): Promise<boolean> {
    if (this.cachedIsInternalComplianceActive === undefined) {
      this.cachedIsInternalComplianceActive = await this.complianceService
        .getInternalComplianceActive(this.user.study)
        .catch((err) => {
          console.error(err);
          return false;
        });
    }
    return this.cachedIsInternalComplianceActive;
  }

  /**
   * Checks for all compliance in the given array, whether there is on unfulfilled compliance.
   * If not, everything is okay and it returns true, even if the array is empty.
   * @param compliances an array of compliance types that must be fulfilled
   */
  public async userHasCompliances(
    compliances: ComplianceType[]
  ): Promise<boolean> {
    if (!compliances) {
      return true;
    }
    for (const compliance of compliances) {
      switch (compliance) {
        case ComplianceType.SAMPLES:
          if (!(await this.userHasSamplesCompliance())) {
            return false;
          }
          break;
        case ComplianceType.BLOODSAMPLES:
          if (!(await this.userHasBloodsamplesCompliance())) {
            return false;
          }
          break;
        case ComplianceType.LABRESULTS:
          if (!(await this.userHasLabresultsCompliance())) {
            return false;
          }
          break;
      }
    }
    return true;
  }

  private async userHasSamplesCompliance(): Promise<boolean> {
    const agreements = await this.getComplianceAgreementForCurrentUser();
    if (agreements) {
      return agreements.compliance_system.samples;
    } else {
      return false;
    }
  }

  private async userHasBloodsamplesCompliance(): Promise<boolean> {
    const agreements = await this.getComplianceAgreementForCurrentUser();
    if (agreements) {
      return agreements.compliance_system.bloodsamples;
    } else {
      return false;
    }
  }

  private async userHasLabresultsCompliance(): Promise<boolean> {
    const agreements = await this.getComplianceAgreementForCurrentUser();
    if (agreements) {
      return agreements.compliance_system.labresults;
    } else {
      return false;
    }
  }

  public async getComplianceAgreementForCurrentUser(): Promise<ComplianceDataResponse> {
    if (!this.complianceDataCache) {
      this.complianceDataCache = await this.complianceService
        .getComplianceAgreementForProband(this.user.study, this.user.username)
        .catch((err) => {
          console.error(err);
          return null;
        });
    }
    return this.complianceDataCache;
  }

  public async updateComplianceAgreementForCurrentUser(
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    const newComplianceData =
      await this.complianceService.createComplianceAgreementForProband(
        this.user.study,
        this.user.username,
        complianceData
      );
    this.complianceDataCache = newComplianceData;
    this.complianceDataChangesSubject.next();
    return newComplianceData;
  }
}
