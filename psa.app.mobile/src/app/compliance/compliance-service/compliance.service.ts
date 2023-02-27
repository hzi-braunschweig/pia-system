/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import {
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceType,
} from '../compliance.model';
import { ComplianceClientService } from '../compliance-client/compliance-client.service';
import { CurrentUser } from '../../auth/current-user.service';

@Injectable({
  providedIn: 'root',
})
/**
 * This service is a conclusion of the new and the old compliance. If there is a new type of compliance
 * (In-App-Compliance) the old one will be ignored.
 */
export class ComplianceService {
  private complianceDataCache: ComplianceDataResponse;
  private complianceDataChangesSubject = new Subject<void>();
  public readonly complianceDataChangesObservable =
    this.complianceDataChangesSubject.asObservable();
  private cachedIsInternalComplianceActive: boolean = undefined;

  constructor(
    private complianceClient: ComplianceClientService,
    private currentUser: CurrentUser
  ) {}

  /**
   * Checks for all compliance in the given array, whether there is on unfulfilled compliance.
   * If not, everything is okay and it returns true, even if the array is empty.
   * @param compliances an array of compliance types that must be fulfilled
   */
  async userHasCompliances(compliances: ComplianceType[]): Promise<boolean> {
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

  async getComplianceAgreementForCurrentUser(): Promise<ComplianceDataResponse> {
    if (!this.complianceDataCache) {
      this.complianceDataCache =
        await this.complianceClient.getComplianceAgreementForCurrentUser(
          this.currentUser.study
        );
    }
    return this.complianceDataCache;
  }

  async updateComplianceAgreementForCurrentUser(
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    this.complianceDataCache =
      await this.complianceClient.createComplianceAgreementForCurrentUser(
        this.currentUser.study,
        complianceData
      );
    this.complianceDataChangesSubject.next();
    return this.complianceDataCache;
  }

  async userHasAppUsageCompliance(): Promise<boolean> {
    const complianceData = await this.getComplianceAgreementForCurrentUser();
    const userComplianceTextExists =
      complianceData &&
      Array.isArray(complianceData.compliance_text_object) &&
      complianceData.compliance_text_object.length > 0;
    return (
      userComplianceTextExists && complianceData.compliance_system.app === true
    );
  }

  async isInternalComplianceActive(): Promise<boolean> {
    if (this.cachedIsInternalComplianceActive === undefined) {
      this.cachedIsInternalComplianceActive =
        await this.complianceClient.getInternalComplianceActive(
          this.currentUser.study
        );
    }
    return this.cachedIsInternalComplianceActive;
  }

  async isInternalComplianceNeeded(): Promise<boolean> {
    return await this.complianceClient.getComplianceNeeded(
      this.currentUser.study
    );
  }
}
