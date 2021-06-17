import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../../auth/auth.service';
import {
  ComplianceDataRequest,
  ComplianceDataResponse,
  ComplianceText,
} from '../compliance.model';
import { EndpointService } from '../../shared/services/endpoint/endpoint.service';

@Injectable({
  providedIn: 'root',
})
export class ComplianceClientService {
  private getApiUrl() {
    return this.endpoint.getUrl() + '/api/v1/compliance/';
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private file: File,
    private fileOpener: FileOpener,
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
        `${this.getApiUrl()}${studyName}/agree/${
          this.auth.getCurrentUser().username
        }`
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
        `${this.getApiUrl()}${studyName}/agree/${
          this.auth.getCurrentUser().username
        }`,
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
          this.auth.getCurrentUser().username
        }/needed`
      )
      .toPromise();
  }

  getComplianceAgreementPdfForCurrentUser(studyName: string): void {
    const fileName = `Einwilligung_${studyName}_${
      this.auth.getCurrentUser().username
    }.pdf`;
    this.http
      .get(
        `${this.getApiUrl()}${studyName}/agree-pdf/${
          this.auth.getCurrentUser().username
        }`,
        { responseType: 'blob' }
      )
      .subscribe((blob) =>
        this.downloadFile(blob, fileName, 'application/pdf')
      );
  }

  private downloadFile(blob: Blob, fileName: string, mimeType: string) {
    this.file
      .writeFile(this.file.dataDirectory, fileName, blob, { replace: true })
      .then((fileEntry) => this.fileOpener.open(fileEntry.toURL(), mimeType))
      .catch((err) => console.log(JSON.stringify(err)));
  }
}
