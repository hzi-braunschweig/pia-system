/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceText,
} from '../compliance.model';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';
import { CurrentUser } from '../../auth/current-user.service';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { FileOpener } from '@capawesome-team/capacitor-file-opener';

@Injectable({
  providedIn: 'root',
})
export class ComplianceClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/compliance/';
  }

  constructor(
    private http: HttpClient,
    private currentUser: CurrentUser,
    private endpoint: EndpointService
  ) {}

  getComplianceText(studyName: string): Promise<ComplianceText> {
    return this.http
      .get<ComplianceText>(`${this.getApiUrl()}${studyName}/text`)
      .toPromise();
  }

  /**
   * For getting compliance data please use the ComplianceService
   * @param studyName The name of the study for that complianceData are fetched
   */
  getComplianceAgreementForCurrentUser(
    studyName: string
  ): Promise<ComplianceDataResponse> {
    return this.http
      .get<ComplianceDataResponse>(
        `${this.getApiUrl()}${studyName}/agree/${this.currentUser.username}`
      )
      .toPromise();
  }

  /**
   * For changing compliance data please use the ComplianceService
   * @param studyName The name of the study for that complianceData are changed
   * @param complianceData The new complianceData without a timestamp
   */
  createComplianceAgreementForCurrentUser(
    studyName: string,
    complianceData: ComplianceDataRequest
  ): Promise<ComplianceDataResponse> {
    return this.http
      .post<ComplianceDataResponse>(
        `${this.getApiUrl()}${studyName}/agree/${this.currentUser.username}`,
        complianceData
      )
      .toPromise();
  }

  /**
   * Checks if a compliance text was created for the specified study
   * @param studyName The name of the study for that complianceData are created
   */
  getInternalComplianceActive(studyName: string): Promise<boolean> {
    return this.http
      .get<boolean>(`${this.getApiUrl()}${studyName}/active`)
      .pipe(catchError(() => of(false)))
      .toPromise();
  }

  /**
   * Checks if a compliance is needed for the specified study
   * @param studyName The name of the study for that it should be checked
   */
  getComplianceNeeded(studyName: string): Promise<boolean> {
    return this.http
      .get<boolean>(
        `${this.getApiUrl()}${studyName}/agree/${
          this.currentUser.username
        }/needed`
      )
      .toPromise();
  }

  getComplianceAgreementPdfForCurrentUser(studyName: string): void {
    const fileName = `Einwilligung_${studyName}_${this.currentUser.username}.pdf`;
    this.http
      .get(
        `${this.getApiUrl()}${studyName}/agree-pdf/${
          this.currentUser.username
        }`,
        { responseType: 'blob' }
      )
      .subscribe((blob) =>
        this.downloadFile(blob, fileName, 'application/pdf')
      );
  }

  private async downloadFile(blob: Blob, fileName: string, mimeType: string) {
    try {
      const base64Data: string = await this.blobToBase64(blob);
      const file = await Filesystem.writeFile({
        directory: Directory.Data,
        path: `files/${fileName}`,
        data: base64Data,
        recursive: true,
      });

      FileOpener.openFile({ path: file.uri, mimeType });
    } catch (e) {
      console.error('Could not write or open file: ', e);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to Base64'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading blob as Base64'));
      reader.readAsDataURL(blob);
    });
  }
}
