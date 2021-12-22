/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ComplianceAgreement,
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceText,
  ComplianceTextInEditMode,
  GenericFieldDescription,
} from '../../models/compliance';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { TemplateSegment } from '../../models/Segments';

@Injectable({
  providedIn: 'root',
})
export class ComplianceService {
  private readonly apiUrl = 'api/v1/compliance/';

  constructor(private http: HttpClient, private auth: AuthenticationManager) {}

  getInternalComplianceActive(studyName: string): Promise<boolean> {
    return this.http
      .get<boolean>(`${this.apiUrl}${studyName}/active`)
      .toPromise();
  }

  /**
   * Gets the current active compliance text for the given study
   * @param studyName the given study for which the text should be loaded
   * @returns a ComplianceText object with the text and the segmented text
   */
  getComplianceText(studyName: string): Promise<ComplianceText> {
    return this.http
      .get<ComplianceText>(`${this.apiUrl}${studyName}/text`)
      .toPromise();
  }

  /**
   * Gets the current active compliance text for the given study
   * @param studyName the given study for which the text should be loaded
   * @returns a ComplianceTextInEditMode with the role where it should be filled
   */
  getComplianceTextForEditing(
    studyName: string
  ): Promise<ComplianceTextInEditMode> {
    return this.http
      .get<ComplianceTextInEditMode>(`${this.apiUrl}${studyName}/text/edit`)
      .toPromise();
  }

  /**
   * Gets the current active compliance text for the given study
   * @param studyName the given study for which the text should be updated
   * @param complianceTextObject the new compliance text as a Object with the responsible role
   * @returns a ComplianceText object with the text or (if the researcher calls the method)
   * a ComplianceTextInEditMode with the role where it should be filled
   */
  updateComplianceText(
    studyName: string,
    complianceTextObject: ComplianceTextInEditMode
  ): Promise<ComplianceTextInEditMode> {
    return this.http
      .put<ComplianceTextInEditMode>(
        `${this.apiUrl}${studyName}/text`,
        complianceTextObject
      )
      .toPromise();
  }

  getGenericFields(studyName: string): Promise<GenericFieldDescription[]> {
    return this.http
      .get<GenericFieldDescription[]>(
        `${this.apiUrl}${studyName}/questionnaire-placeholder`
      )
      .toPromise();
  }

  addGenericField(
    studyName: string,
    placeholderObject: GenericFieldDescription
  ): Promise<GenericFieldDescription[]> {
    return this.http
      .post<GenericFieldDescription[]>(
        `${this.apiUrl}${studyName}/questionnaire-placeholder`,
        placeholderObject
      )
      .toPromise();
  }

  /**
   * for getting compliance data please use the ComplianceManager
   * @param studyName The name of the study for that complianceData are fetched
   * @param username The name of the user for that complianceData are fetched
   */
  getComplianceAgreementForUser(
    studyName: string,
    username: string
  ): Promise<ComplianceDataResponse> {
    return this.http
      .get<ComplianceDataResponse>(
        `${this.apiUrl}${studyName}/agree/${username}`
      )
      .toPromise()
      .then((data: ComplianceDataResponse) => {
        return this.formatComplianceResponseDates(data);
      });
  }

  /**
   * for changing compliance data please use the ComplianceManager
   * @param studyName The name of the study for that complianceData are changed
   * @param username The name of the user for that complianceData are changed
   * @param complianceData The new complianceData without a timestamp
   */
  createComplianceAgreementForUser(
    studyName: string,
    username: string,
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    return this.http
      .post<ComplianceDataResponse>(
        `${this.apiUrl}${studyName}/agree/${username}`,
        complianceData
      )
      .toPromise();
  }

  getComplianceNeeded(studyName: string): Promise<boolean> {
    return this.http
      .get<boolean>(
        `${
          this.apiUrl
        }${studyName}/agree/${this.auth.getCurrentUsername()}/needed`
      )
      .toPromise();
  }

  getComplianceAgreementPdfForUser(studyName: string, username: string): void {
    this.getPdfFromUrl(`${this.apiUrl}${studyName}/agree-pdf/${username}`);
  }

  getComplianceAgreementPdfById(studyName: string, complianceId: number): void {
    this.getPdfFromUrl(
      `${this.apiUrl}${studyName}/agree-pdf/instance/${complianceId}`
    );
  }

  private getPdfFromUrl(url): void {
    this.http
      .get(url, {
        responseType: 'blob',
      })
      .subscribe((data) => {
        const downloadURL = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = downloadURL;
        link.target = '_blank';
        link.click();
      });
  }

  postComplianceTextPreview(text: string): Promise<TemplateSegment[]> {
    return this.http
      .post<TemplateSegment[]>(`${this.apiUrl}text/preview`, {
        compliance_text: text,
      })
      .toPromise();
  }

  getAllCompliancesForProfessional(): Promise<ComplianceAgreement[]> {
    return this.http
      .get<ComplianceAgreement[]>(`${this.apiUrl}agree/all`)
      .toPromise()
      .then((complianceAgreements: ComplianceAgreement[]) => {
        for (const compliance of complianceAgreements) {
          if (compliance && compliance.birthdate) {
            compliance.birthdate = new Date(compliance.birthdate);
          }
        }
        return complianceAgreements;
      });
  }

  getComplianceAgreementById(
    study: string,
    id: number
  ): Promise<ComplianceDataResponse> {
    return this.http
      .get<ComplianceDataResponse>(
        `${this.apiUrl}${study}/agree/instance/${id}`
      )
      .toPromise()
      .then((data: ComplianceDataResponse) => {
        return this.formatComplianceResponseDates(data);
      });
  }

  private formatComplianceResponseDates(
    data: ComplianceDataResponse
  ): ComplianceDataResponse {
    if (data?.timestamp) {
      data.timestamp = new Date(data.timestamp);
    }
    if (data?.textfields?.birthdate) {
      data.textfields.birthdate = new Date(data.textfields.birthdate);
    }
    return data;
  }
}
