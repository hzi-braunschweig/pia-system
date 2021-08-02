/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { AuthenticationManager } from './authentication-manager.service';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceType,
} from '../psa.app.core/models/compliance';
import { ComplianceService } from 'src/app/psa.app.core/providers/compliance-service/compliance-service';
import { QuestionnaireService } from 'src/app/psa.app.core/providers/questionnaire-service/questionnaire-service';
import { Studie } from '../psa.app.core/models/studie';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
/**
 * This service is a conclusion of the new and the old compliance. If there is a new type of compliance
 * (In-App-Compliance) the old one will be ignored.
 */
export class ComplianceManager {
  private complianceDataCache: Map<string, ComplianceDataResponse>;
  private complianceDataChangesSubject: Subject<string>;
  public readonly complianceDataChangesObservable: Observable<string>;
  private _primaryStudy: Promise<Studie>;
  private cachedIsInternalComplianceActive: Promise<boolean> = undefined;

  constructor(
    private auth: AuthenticationManager,
    private complianceService: ComplianceService,
    private questionnaireService: QuestionnaireService
  ) {
    this.auth.currentUserObservable.subscribe(async (user) => {
      // on user change clear cache
      this.complianceDataCache = new Map<string, ComplianceDataResponse>();
      this.cachedIsInternalComplianceActive = undefined;
      this._primaryStudy = null;
    });
    this.complianceDataChangesSubject = new Subject<string>();
    this.complianceDataChangesObservable =
      this.complianceDataChangesSubject.asObservable();
  }

  get isInternalComplianceActive(): Promise<boolean> {
    if (this.cachedIsInternalComplianceActive === undefined) {
      this.cachedIsInternalComplianceActive = this.primaryStudy
        .then((study) =>
          this.complianceService.getInternalComplianceActive(study.name)
        )
        .catch((err) => {
          console.error(err);
          return false;
        });
    }
    return this.cachedIsInternalComplianceActive;
  }

  private get primaryStudy(): Promise<Studie> {
    if (!this._primaryStudy) {
      this._primaryStudy = this.questionnaireService.getPrimaryStudy();
    }
    return this._primaryStudy;
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
      studyName = (await this.primaryStudy).name;
    }
    if (!this.complianceDataCache.has(studyName)) {
      const newComplianceData = await this.complianceService
        .getComplianceAgreementForUser(
          studyName,
          this.auth.currentUser.username
        )
        .catch((err) => {
          console.error(err);
          return null;
        });
      this.complianceDataCache.set(studyName, newComplianceData);
    }
    return this.complianceDataCache.get(studyName);
  }

  async updateComplianceAgreementForCurrentUser(
    complianceData: ComplianceDataRequest,
    studyName?: string
  ): Promise<ComplianceDataResponse> {
    if (!studyName) {
      studyName = (await this.primaryStudy).name;
    }
    const newComplianceData =
      await this.complianceService.createComplianceAgreementForUser(
        studyName,
        this.auth.currentUser.username,
        complianceData
      );
    this.complianceDataCache.set(studyName, newComplianceData);
    this.complianceDataChangesSubject.next(studyName);
    return newComplianceData;
  }
}
