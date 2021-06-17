import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

import {
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceType,
} from '../compliance.model';
import { ComplianceClientService } from '../compliance-client/compliance-client.service';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../auth/auth.model';
import { PrimaryStudyService } from '../../shared/services/primary-study/primary-study.service';

@Injectable({
  providedIn: 'root',
})
/**
 * This service is a conclusion of the new and the old compliance. If there is a new type of compliance
 * (In-App-Compliance) the old one will be ignored.
 */
export class ComplianceService {
  private complianceDataCache: Map<string, ComplianceDataResponse> = new Map();
  private complianceDataChangesSubject: Subject<string>;
  public readonly complianceDataChangesObservable: Observable<string>;
  private cachedIsInternalComplianceActive: boolean = undefined;

  private primaryStudyName: string;

  constructor(
    private auth: AuthService,
    private complianceClient: ComplianceClientService,
    private primaryStudyService: PrimaryStudyService
  ) {
    this.auth.loggedIn.subscribe(() => {
      // on user change clear cache
      this.complianceDataCache = new Map<string, ComplianceDataResponse>();
      this.primaryStudyName = null;
      this.cachedIsInternalComplianceActive = undefined;
    });
    this.complianceDataChangesSubject = new Subject<string>();
    this.complianceDataChangesObservable =
      this.complianceDataChangesSubject.asObservable();
  }

  private async getPrimaryStudyName(): Promise<string> {
    if (!this.primaryStudyName) {
      const primaryStudy = await this.primaryStudyService.getPrimaryStudy();
      this.primaryStudyName = primaryStudy.name;
    }
    return this.primaryStudyName;
  }

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

  async getComplianceAgreementForCurrentUser(
    studyName?: string
  ): Promise<ComplianceDataResponse> {
    if (!studyName) {
      studyName = await this.getPrimaryStudyName();
    }
    if (!this.complianceDataCache.has(studyName)) {
      const newComplianceData =
        await this.complianceClient.getComplianceAgreementForCurrentUser(
          studyName
        );
      this.complianceDataCache.set(studyName, newComplianceData);
    }
    return this.complianceDataCache.get(studyName);
  }

  async updateComplianceAgreementForCurrentUser(
    complianceData: ComplianceDataRequest,
    studyName?: string
  ): Promise<ComplianceDataResponse> {
    if (!studyName) {
      studyName = await this.getPrimaryStudyName();
    }
    const newComplianceData =
      await this.complianceClient.createComplianceAgreementForCurrentUser(
        studyName,
        complianceData
      );
    this.complianceDataCache.set(studyName, newComplianceData);
    this.complianceDataChangesSubject.next(studyName);
    return newComplianceData;
  }

  getCurrentUser(): User {
    return JSON.parse(localStorage.getItem('currentUser'));
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
      const studyName = await this.getPrimaryStudyName();
      this.cachedIsInternalComplianceActive =
        await this.complianceClient.getInternalComplianceActive(studyName);
    }
    return this.cachedIsInternalComplianceActive;
  }

  async isInternalComplianceNeeded(): Promise<boolean> {
    const studyName = await this.getPrimaryStudyName();
    return await this.complianceClient.getComplianceNeeded(studyName);
  }
}
