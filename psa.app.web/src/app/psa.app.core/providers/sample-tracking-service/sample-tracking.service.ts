/*
 * SPDX-FileCopyrightText: 2021 Helmholtz-Zentrum für Infektionsforschung GmbH (HZI) <PiaPost@helmholtz-hzi.de>
 *
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { Injectable } from '@angular/core';
import { BloodSample, LabResult } from '../../models/labresult';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationManager } from '../../../_services/authentication-manager.service';
import { Questionnaire } from '../../models/questionnaire';

@Injectable()
export class SampleTrackingService {
  private readonly apiUrl = 'api/v1/sample/';

  constructor(private http: HttpClient, private auth: AuthenticationManager) {}

  /**
   * Return a list with laboratory results for proband
   * @param  id Proband Id
   * @return list with laboratory results
   */
  async getAllLabResultsForUser(id): Promise<LabResult[]> {
    return this.http
      .get<LabResult[]>(this.apiUrl + `probands/${id}/labResults`)
      .toPromise();
  }

  /**
   * Return a list with laboratory results for one sample id ... sounds weird, sure this is right?
   * @param  sampleID Proband Id
   * @return list with laboratory results
   */
  getLabResultsForSampleID(sampleID): Promise<LabResult[]> {
    return this.http
      .get<LabResult[]>(this.apiUrl + `labResults/${sampleID}`)
      .toPromise();
  }

  /**
   * Returns laboratory observations for specific labor result for user as HTML
   * @param userID the users ID == pseudonym
   * @param resultID the ID of the laboratory-result
   * @return a html string as a presentation of the laboratory result
   */
  getLabResultObservationForUser(userID, resultID): Promise<string> {
    const headers = new HttpHeaders({
      Accept: 'text/html',
    });
    return this.http
      .get(this.apiUrl + `probands/${userID}/labResults/${resultID}`, {
        headers,
        responseType: 'text',
      })
      .toPromise();
  }

  /**
   * Update single lab result
   * @param probandID  Id of the proband
   * @param resultID Id of the laboratory result
   * @param newData data you want to update
   */
  putLabResult(
    probandID: string,
    resultID: string,
    newData: {
      remark?: string;
      new_samples_sent?: boolean;
      date_of_sampling?: string | Date;
      dummy_sample_id?: string;
      status?: string;
    }
  ): Promise<LabResult> {
    return this.http
      .put<LabResult>(
        this.apiUrl + `probands/${probandID}/labResults/${resultID}`,
        newData
      )
      .toPromise();
  }

  /**
   * Creates lab result
   * @param probandID  Id of the proband
   * @param labResult The laboratory result
   */
  postLabResult(probandID: string, labResult): Promise<LabResult> {
    return this.http
      .post<LabResult>(
        this.apiUrl + `probands/${probandID}/labResults`,
        labResult
      )
      .toPromise();
  }

  /**
   * Return a list with blood samples for proband
   * @param  probandID Proband Id
   * @return list with blood samples
   */
  getAllBloodSamplesForUser(probandID): Promise<BloodSample[]> {
    return this.http
      .get<BloodSample[]>(this.apiUrl + `probands/${probandID}/bloodSamples`)
      .toPromise();
  }

  /**
   * Return a list with blood samples for one blood sample id ... sounds weird, sure this is right?
   * @param  sampleID The blood sample's Id
   * @return list with blood samples
   */
  getBloodSamplesForBloodSampleID(sampleID): Promise<LabResult[]> {
    return this.http
      .get<LabResult[]>(this.apiUrl + `bloodResult/${sampleID}`)
      .toPromise();
  }

  /**
   * Update single lab result
   * @param probandID  Id of the proband
   * @param sampleID Id of the blood sample
   * @param newData data you want to update
   */
  putBloodSample(
    probandID: string,
    sampleID: string,
    newData: { remark?: string; blood_sample_carried_out?: boolean }
  ): Promise<object> {
    return this.http
      .put(
        this.apiUrl + `probands/${probandID}/bloodSamples/${sampleID}`,
        newData
      )
      .toPromise();
  }

  /**
   * Creates blood sample
   * @param probandID  Id of the proband
   * @param bloodSample The blood sample
   */
  postBloodSample(probandID: string, bloodSample): Promise<object> {
    return this.http
      .post(this.apiUrl + `probands/${probandID}/bloodSamples`, bloodSample)
      .toPromise();
  }

  /**
   * Updates Sample Status and Sample Date for a sample id
   *
   * @param sampleID sample Id
   * @param dummySampleId a Bact-sample ID ... whatever that is
   */
  updateSampleStatusAndSampleDateFor(
    sampleID: string,
    dummySampleId: string
  ): Promise<LabResult> {
    const data = {
      remark: '', // will be ignored from back end
      new_samples_sent: true, // will be ignored from backend
      date_of_sampling: new Date(), // only relevant information for background
      dummy_sample_id: dummySampleId ? dummySampleId : undefined,
    };
    return this.putLabResult(this.auth.currentUser.username, sampleID, data);
  }

  requestMaterialForCurrentUser(): Promise<Questionnaire> {
    return this.http
      .post<Questionnaire>(
        this.apiUrl +
          'probands/' +
          this.auth.currentUser.username +
          '/needsMaterial',
        {}
      )
      .toPromise();
  }
}
